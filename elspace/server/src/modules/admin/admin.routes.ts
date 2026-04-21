// server/src/modules/admin/admin.routes.ts
import { Router, Response } from 'express';
import { adminService } from './admin.service';
import { adminMiddleware, moderatorMiddleware, AuthRequest } from '../../config/auth';

const router = Router();

/**
 * GET /api/admin/dashboard - Get dashboard overview
 */
router.get('/dashboard', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const overview = await adminService.getDashboardOverview();
    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users - Get users list
 */
router.get('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
    };

    const result = await adminService.getUsers(page, limit, filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users/:userId - Get user details
 */
router.get('/users/:userId', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prisma } = await import('../../database/prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        profile: true,
        wallet: true,
        freelancerProfile: true,
        clientProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/users/:userId/status - Update user status
 */
router.patch('/users/:userId/status', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, reason } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await adminService.updateUserStatus(req.params.userId, status, reason);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/transactions - Get transactions
 */
router.get('/transactions', moderatorMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      type: req.query.type,
      status: req.query.status,
      userId: req.query.userId,
    };

    const result = await adminService.getTransactions(page, limit, filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/withdrawals - Get withdrawals
 */
router.get('/withdrawals', moderatorMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status || 'PENDING',
      method: req.query.method,
      userId: req.query.userId,
    };

    const result = await adminService.getWithdrawals(page, limit, filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/withdrawals/:withdrawalId/approve - Approve withdrawal
 */
router.post('/withdrawals/:withdrawalId/approve', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;

    const withdrawal = await (await import('../../modules/wallet/wallet.service')).walletService.approveWithdrawal(
      req.params.withdrawalId,
      req.userId!,
      notes
    );

    res.json(withdrawal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/withdrawals/:withdrawalId/reject - Reject withdrawal
 */
router.post('/withdrawals/:withdrawalId/reject', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason required' });
    }

    const withdrawal = await (await import('../../modules/wallet/wallet.service')).walletService.rejectWithdrawal(
      req.params.withdrawalId,
      reason,
      req.userId!
    );

    res.json(withdrawal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/disputes - Get disputes
 */
router.get('/disputes', moderatorMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status,
    };

    const result = await adminService.getDisputes(page, limit, filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/notifications/send - Send system notification
 */
router.post('/notifications/send', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, title, message, type } = req.body;

    if (!userIds || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await adminService.sendSystemNotification(userIds, title, message, type);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/email/broadcast - Send broadcast email
 */
router.post('/email/broadcast', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { query, subject, html } = req.body;

    if (!query || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await adminService.sendBroadcastEmail(query, subject, html);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/analytics - Get platform analytics
 */
router.get('/analytics', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as any) || 'month';
    const analytics = await adminService.getAnalytics(timeframe);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
