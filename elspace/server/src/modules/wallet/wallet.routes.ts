// server/src/modules/wallet/wallet.routes.ts
import { Router, Response } from 'express';
import { walletService } from './wallet.service';
import { authMiddleware, AuthRequest } from '../../config/auth';

const router = Router();

/**
 * GET /api/wallet - Get user's wallet
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const wallet = await walletService.getOrCreateWallet(req.userId!);
    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallet/summary - Get wallet summary
 */
router.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const summary = await walletService.getWalletSummary(req.userId!);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallet/transactions - Get transaction history
 */
router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const wallet = await walletService.getOrCreateWallet(req.userId!);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      (await import('@/database/prisma')).prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (await import('@/database/prisma')).prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/deposit - Deposit funds
 */
router.post('/deposit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, method, externalId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const transaction = await walletService.addFunds(
      req.userId!,
      amount,
      externalId,
      `Deposit via ${method}`
    );

    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/withdrawal - Request withdrawal
 */
router.post('/withdrawal', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, method, destination, destinationDetails } = req.body;

    if (!amount || !method || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const withdrawal = await walletService.requestWithdrawal({
      userId: req.userId!,
      amount,
      method,
      destination,
      destinationDetails,
    });

    res.json(withdrawal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/transfer - Transfer between users
 */
router.post('/transfer', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, amount, description } = req.body;

    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const transaction = await walletService.transferFunds({
      fromUserId: req.userId!,
      toUserId,
      amount,
      description,
    });

    res.json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
