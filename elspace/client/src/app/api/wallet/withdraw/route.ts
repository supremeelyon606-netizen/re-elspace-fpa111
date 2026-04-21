import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/database/prisma'
import { z } from 'zod'

const withdrawalSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is $10').max(10000, 'Maximum withdrawal is $10,000'),
  method: z.enum(['BANK_TRANSFER', 'PAYPAL', 'CRYPTO']),
  destination: z.string().min(1, 'Destination is required'),
  destinationDetails: z.object({}).optional(),
  bankAccountId: z.string().optional(),
  paypalAccountId: z.string().optional(),
  cryptoWalletId: z.string().optional(),
  currency: z.string().default('USD'),
})

type WithdrawalInput = z.infer<typeof withdrawalSchema>

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check KYC
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        kycStatus: true, 
        legalFirstName: true, 
        legalLastName: true,
        wallet: true,
      },
    })

    if (user?.kycStatus !== 'APPROVED') {
      return NextResponse.json({ 
        message: 'KYC verification required for withdrawals' 
      }, { status: 403 })
    }

    const body = await req.json()
    const validated = withdrawalSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        message: 'Invalid withdrawal data',
        errors: validated.error.errors 
      }, { status: 400 })
    }

    const data = validated.data

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet || wallet.availableBalance < data.amount) {
      return NextResponse.json({ 
        message: 'Insufficient balance' 
      }, { status: 400 })
    }

    // Calculate fee (2.5%)
    const feePercentage = 2.5
    const fee = (data.amount * feePercentage) / 100
    const netAmount = data.amount - fee

    // Verify destination matches user's legal name for bank transfers
    if (data.method === 'BANK_TRANSFER' && data.bankAccountId) {
      const bankAccount = await prisma.bankAccount.findUnique({
        where: { id: data.bankAccountId },
      })

      if (!bankAccount || bankAccount.walletId !== wallet.id) {
        return NextResponse.json({ message: 'Invalid bank account' }, { status: 400 })
      }

      // Verify account holder matches legal name (basic check)
      const legalFullName = `${user.legalFirstName} ${user.legalLastName}`.toLowerCase()
      const accountHolderLower = bankAccount.accountHolder.toLowerCase()
      
      if (!accountHolderLower.includes(user.legalFirstName?.toLowerCase() || '') &&
          !accountHolderLower.includes(user.legalLastName?.toLowerCase() || '')) {
        return NextResponse.json({ 
          message: 'Bank account holder name must match your verified legal name' 
        }, { status: 400 })
      }
    }

    // Calculate risk score (simple version)
    let riskScore = 0
    const riskFlags: string[] = []

    if (data.amount > 1000) {
      riskScore += 20
      riskFlags.push('HIGH_AMOUNT')
    }
    if (data.amount > 5000) {
      riskScore += 30
      riskFlags.push('VERY_HIGH_AMOUNT')
    }

    // Create withdrawal with transaction
    const withdrawal = await prisma.$transaction(async (tx) => {
      // Deduct from available balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: data.amount },
          pendingBalance: { increment: data.amount },
        },
      })

      // Create withdrawal record
      const withdrawalRecord = await tx.withdrawal.create({
        data: {
          userId: session.user.id,
          walletId: wallet.id,
          amount: data.amount,
          fee,
          feePercentage,
          netAmount,
          method: data.method as any,
          destination: data.destination,
          destinationDetails: data.destinationDetails || null,
          status: 'PENDING',
          riskScore,
          riskFlags,
          bankAccountId: data.bankAccountId,
        },
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount: data.amount,
          fee,
          reference: withdrawalRecord.withdrawalId,
          description: `Withdrawal via ${data.method}`,
        },
      })

      return withdrawalRecord
    })

    // Create notification for admins (TODO: implement notification system)

    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ message: 'Failed to process withdrawal' }, { status: 500 })
  }
}

// GET recent withdrawals
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        netAmount: true,
        fee: true,
        method: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    })

    return NextResponse.json(withdrawals)
  } catch (error) {
    console.error('Get withdrawals error:', error)
    return NextResponse.json({ message: 'Failed to fetch withdrawals' }, { status: 500 })
  }
}
