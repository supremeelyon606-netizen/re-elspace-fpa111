// server/src/modules/admin/admin.service.ts
import { prisma } from '../../database/prisma';
import { brevoService } from '../email/brevo.service';

export class AdminService {
  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    const [totalUsers, activeUsers, totalRevenue, pendingWithdrawals, disputeCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'PAYMENT',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.withdrawal.count({
        where: { status: 'PENDING' },
      }),
      prisma.dispute.count({
        where: { status: 'OPEN' },
      }),
    ]);

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { wallet: { include: { user: true } } },
    });

    return {
      stats: {
        totalUsers,
        activeUsers,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingWithdrawals,
        openDisputes: disputeCount,
      },
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        userName: t.wallet.user.firstName + ' ' + t.wallet.user.lastName,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Get users with pagination and filters
   */
  async getUsers(page: number = 1, limit: number = 20, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { uniqueUserId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          kycStatus: true,
          createdAt: true,
          profile: { select: { totalEarned: true, completedProjects: true } },
          wallet: { select: { availableBalance: true, totalEarned: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(page: number = 1, limit: number = 20, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.wallet = { userId: filters.userId };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map(t => ({
        id: t.id,
        transactionId: t.transactionId,
        type: t.type,
        status: t.status,
        amount: t.amount,
        fee: t.fee,
        currency: t.currency,
        user: t.wallet.user,
        description: t.description,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get withdrawals with filtering
   */
  async getWithdrawals(page: number = 1, limit: number = 20, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.method) where.method = filters.method;
    if (filters.userId) where.userId = filters.userId;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: filters.status === 'PENDING' ? 'asc' : 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          processor: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return {
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get disputes
   */
  async getDisputes(page: number = 1, limit: number = 20, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          initiator: { select: { id: true, email: true, firstName: true, lastName: true } },
          respondent: { select: { id: true, email: true, firstName: true, lastName: true } },
          project: { select: { id: true, title: true } },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Suspend or unsuspend user
   */
  async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED', reason?: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    // Send notification email
    const statusMessage = status === 'ACTIVE' ? 'reactivated' : 'suspended';
    await brevoService.sendEmail({
      to: [user.email],
      subject: `Account ${statusMessage}`,
      html: `
        <h1>Account Update</h1>
        <p>Hi ${user.firstName},</p>
        <p>Your account has been ${statusMessage}.${reason ? ` Reason: ${reason}` : ''}</p>
        <p>If you have questions, please contact support.</p>
      `,
    });

    return user;
  }

  /**
   * Send system notification to users
   */
  async sendSystemNotification(userIds: string[], title: string, message: string, type: string = 'SYSTEM_ALERT') {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        read: false,
      })),
    });

    // Send email to all users (if opted in)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { email: true, firstName: true },
    });

    await Promise.all(
      users.map(user =>
        brevoService.sendEmail({
          to: [user.email],
          subject: title,
          html: `
            <h1>${title}</h1>
            <p>Hi ${user.firstName},</p>
            <p>${message}</p>
          `,
        })
      )
    );

    return notifications;
  }

  /**
   * Send broadcast email
   */
  async sendBroadcastEmail(query: any, subject: string, html: string) {
    const users = await prisma.user.findMany({
      where: query,
      select: { email: true, id: true },
    });

    const emails = users.map(u => u.email);

    if (emails.length === 0) {
      throw new Error('No users found matching criteria');
    }

    // Send in batches to avoid hitting API limits
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await brevoService.sendBulkEmail({
        to: batch,
        subject,
        html,
      });
    }

    return {
      success: true,
      emailsSent: emails.length,
    };
  }

  /**
   * Get platform analytics
   */
  async getAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
    const daysBack = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    }[timeframe];

    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const [
      newUsers,
      activeUsers,
      totalRevenue,
      completeProjects,
      averageProjectValue,
      userRetention,
      topFreelancers,
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.user.count({
        where: { lastActive: { gte: startDate } },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'PAYMENT',
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.project.count({
        where: { status: 'COMPLETED', updatedAt: { gte: startDate } },
      }),
      prisma.project.aggregate({
        where: { updatedAt: { gte: startDate } },
        _avg: { budgetMax: true },
      }),
      this.calculateUserRetention(startDate),
      this.getTopFreelancers(startDate),
    ]);

    return {
      timeframe,
      metrics: {
        newUsers,
        activeUsers,
        totalRevenue: totalRevenue._sum.amount || 0,
        completeProjects,
        averageProjectValue: averageProjectValue._avg.budgetMax || 0,
        userRetention,
      },
      topFreelancers,
    };
  }

  private async calculateUserRetention(startDate: Date): Promise<number> {
    const returnedUsers = await prisma.user.count({
      where: {
        createdAt: { lt: startDate },
        lastActive: { gte: startDate },
      },
    });

    const oldUsers = await prisma.user.count({
      where: {
        createdAt: { lt: startDate },
      },
    });

    return oldUsers > 0 ? Math.round((returnedUsers / oldUsers) * 100) : 0;
  }

  private async getTopFreelancers(startDate: Date) {
    return await prisma.user.findMany({
      where: {
        role: 'FREELANCER',
        proposals: {
          some: {
            createdAt: { gte: startDate },
          },
        },
      },
      include: {
        profile: { select: { completedProjects: true, totalEarned: true } },
        wallet: { select: { totalEarned: true } },
      },
      orderBy: {
        profile: {
          totalEarned: 'desc',
        },
      },
      take: 10,
    });
  }
}

export const adminService = new AdminService();
