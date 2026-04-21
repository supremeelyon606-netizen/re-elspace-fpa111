// server/src/modules/wallet/wallet.service.ts
import { prisma } from '../../database/prisma';
import { brevoService } from '../email/brevo.service';
import { generateId } from '../../utils/generateId';

interface WithdrawalRequest {
  userId: string;
  amount: number;
  method: 'BANK_TRANSFER' | 'PAYPAL' | 'CRYPTO' | 'WISE' | 'PAYONEER';
  destination: string;
  destinationDetails?: Record<string, any>;
}

interface TransferRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  projectId?: string;
}

export class WalletService {
  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        paymentMethods: true,
        bankAccounts: true,
      },
    });

    if (wallet) {
      return wallet;
    }

    // Create new wallet
    return await prisma.wallet.create({
      data: {
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        escrowBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
        currency: 'USD',
      },
      include: {
        transactions: true,
        paymentMethods: true,
        bankAccounts: true,
      },
    });
  }

  /**
   * Add funds to wallet (deposit)
   */
  async addFunds(userId: string, amount: number, externalId?: string, description?: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const transaction = await prisma.transaction.create({
      data: {
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: wallet.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount,
        currency: wallet.currency,
        description: description || 'Deposit',
        externalId,
        completedAt: new Date(),
      },
    });

    // Update wallet balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount },
        totalEarned: { increment: amount },
      },
    });

    return transaction;
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(request: WithdrawalRequest) {
    const { userId, amount, method, destination, destinationDetails } = request;
    
    // Validate minimum and maximum amounts
    const minAmount = parseFloat(process.env.WITHDRAWAL_MIN_AMOUNT || '100');
    const maxAmount = parseFloat(process.env.WITHDRAWAL_MAX_AMOUNT || '10000');

    if (amount < minAmount) {
      throw new Error(`Minimum withdrawal amount is $${minAmount}`);
    }

    if (amount > maxAmount) {
      throw new Error(`Maximum withdrawal amount is $${maxAmount}`);
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Calculate fee
    const feePercentage = parseFloat(process.env.WITHDRAWAL_FEE_PERCENTAGE || '2.5');
    const fee = (amount * feePercentage) / 100;
    const netAmount = amount - fee;

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        withdrawalId: `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        walletId: wallet.id,
        amount,
        fee,
        feePercentage,
        netAmount,
        currency: wallet.currency,
        method,
        destination, // This should be encrypted in production
        destinationDetails: destinationDetails || {},
        status: 'PENDING',
      },
    });

    // Deduct from available balance and move to pending
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        amount,
        fee,
        currency: wallet.currency,
        description: `Withdrawal via ${method}`,
        metadata: {
          withdrawalId: withdrawal.id,
          method,
        },
      },
    });

    // Send confirmation email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await brevoService.sendEmail({
        to: [user.email],
        subject: `Withdrawal Request Received - $${amount.toFixed(2)}`,
        html: this.getWithdrawalConfirmationEmail(user.firstName || 'User', amount, netAmount, fee),
      });
    }

    return withdrawal;
  }

  /**
   * Approve withdrawal (admin action)
   */
  async approveWithdrawal(withdrawalId: string, processedBy: string, notes?: string) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: true, user: true },
    });

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new Error('Withdrawal is not pending');
    }

    // Update withdrawal status
    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'APPROVED',
        processedAt: new Date(),
        processedBy,
        processorNotes: notes,
      },
    });

    // Update wallet - move from pending to completed
    await prisma.wallet.update({
      where: { id: withdrawal.walletId },
      data: {
        pendingBalance: { decrement: withdrawal.amount },
        totalSpent: { increment: withdrawal.amount },
      },
    });

    // Update transaction
    await prisma.transaction.updateMany({
      where: {
        metadata: {
          path: ['withdrawalId'],
          equals: withdrawalId,
        },
      },
      data: {
        status: 'PROCESSING',
      },
    });

    // Send approval email
    if (withdrawal.user) {
      await brevoService.sendEmail({
        to: [withdrawal.user.email],
        subject: `Withdrawal Approved - $${withdrawal.amount.toFixed(2)}`,
        html: this.getWithdrawalApprovedEmail(
          withdrawal.user.firstName || 'User',
          withdrawal.amount,
          withdrawal.netAmount
        ),
      });
    }

    return updated;
  }

  /**
   * Reject withdrawal (admin action)
   */
  async rejectWithdrawal(withdrawalId: string, reason: string, processedBy: string) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: true, user: true },
    });

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // Update withdrawal status
    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        processedAt: new Date(),
        processedBy,
      },
    });

    // Refund to available balance
    await prisma.wallet.update({
      where: { id: withdrawal.walletId },
      data: {
        availableBalance: { increment: withdrawal.amount },
        pendingBalance: { decrement: withdrawal.amount },
      },
    });

    // Create refund transaction
    await prisma.transaction.create({
      data: {
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: withdrawal.walletId,
        type: 'REFUND',
        status: 'COMPLETED',
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        description: `Withdrawal rejected: ${reason}`,
        completedAt: new Date(),
      },
    });

    // Send rejection email
    if (withdrawal.user) {
      await brevoService.sendEmail({
        to: [withdrawal.user.email],
        subject: `Withdrawal Rejected - $${withdrawal.amount.toFixed(2)}`,
        html: this.getWithdrawalRejectedEmail(
          withdrawal.user.firstName || 'User',
          withdrawal.amount,
          reason
        ),
      });
    }

    return updated;
  }

  /**
   * Transfer funds between users
   */
  async transferFunds(request: TransferRequest) {
    const { fromUserId, toUserId, amount, description, projectId } = request;

    // Get both wallets
    const fromWallet = await this.getOrCreateWallet(fromUserId);
    const toWallet = await this.getOrCreateWallet(toUserId);

    if (fromWallet.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: fromWallet.id,
        type: 'TRANSFER',
        status: 'COMPLETED',
        amount,
        currency: fromWallet.currency,
        fromUserId,
        toUserId,
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        description: description || 'Transfer',
        metadata: {
          projectId,
        },
        completedAt: new Date(),
      },
    });

    // Update wallets
    await Promise.all([
      prisma.wallet.update({
        where: { id: fromWallet.id },
        data: {
          availableBalance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      }),
      prisma.wallet.update({
        where: { id: toWallet.id },
        data: {
          availableBalance: { increment: amount },
          totalEarned: { increment: amount },
        },
      }),
    ]);

    return transaction;
  }

  /**
   * Get wallet summary for dashboard
   */
  async getWalletSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const monthlyEarnings = await prisma.transaction.aggregate({
      where: {
        walletId: wallet.id,
        type: { in: ['DEPOSIT', 'TRANSFER'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { amount: true },
    });

    const monthlySpending = await prisma.transaction.aggregate({
      where: {
        walletId: wallet.id,
        type: { in: ['WITHDRAWAL', 'PAYMENT'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { amount: true },
    });

    return {
      user: {
        id: user?.id,
        name: `${user?.firstName} ${user?.lastName}`,
        email: user?.email,
      },
      balance: {
        available: wallet.availableBalance,
        pending: wallet.pendingBalance,
        escrow: wallet.escrowBalance,
        total: wallet.availableBalance + wallet.pendingBalance + wallet.escrowBalance,
      },
      earnings: {
        total: wallet.totalEarned,
        monthly: monthlyEarnings._sum.amount || 0,
      },
      spending: {
        total: wallet.totalSpent,
        monthly: monthlySpending._sum.amount || 0,
      },
    };
  }

  /**
   * Email templates
   */
  private getWithdrawalConfirmationEmail(name: string, amount: number, netAmount: number, fee: number): string {
    return `
      <h1>Withdrawal Request Received</h1>
      <p>Hi ${name},</p>
      <p>We've received your withdrawal request for <strong>$${amount.toFixed(2)}</strong>.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Gross Amount: $${amount.toFixed(2)}</li>
        <li>Fee: $${fee.toFixed(2)}</li>
        <li>Net Amount: $${netAmount.toFixed(2)}</li>
      </ul>
      <p>Your withdrawal is being reviewed and will be processed within 24 hours.</p>
      <p>Best regards,<br/>EL SPACE Team</p>
    `;
  }

  private getWithdrawalApprovedEmail(name: string, amount: number, netAmount: number): string {
    return `
      <h1>Withdrawal Approved</h1>
      <p>Hi ${name},</p>
      <p>Your withdrawal request for <strong>$${netAmount.toFixed(2)}</strong> has been approved!</p>
      <p>You should see the funds in your account within 1-3 business days.</p>
      <p>Best regards,<br/>EL SPACE Team</p>
    `;
  }

  private getWithdrawalRejectedEmail(name: string, amount: number, reason: string): string {
    return `
      <h1>Withdrawal Rejected</h1>
      <p>Hi ${name},</p>
      <p>Unfortunately, your withdrawal request for <strong>$${amount.toFixed(2)}</strong> has been rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>The amount has been refunded to your wallet. Please contact support if you have questions.</p>
      <p>Best regards,<br/>EL SPACE Team</p>
    `;
  }
}

export const walletService = new WalletService();
