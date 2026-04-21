import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/database/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const isFreelancer = session.user.role === 'FREELANCER'

    // Get user with KYC status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    })

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        availableBalance: true,
        pendingBalance: true,
        escrowBalance: true,
        totalEarned: true,
        totalSpent: true,
      },
    })

    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      where: isFreelancer
        ? { 
            OR: [
              { contracts: { some: { freelancerId: userId } } }
            ]
          }
        : { clientId: userId },
      include: {
        client: { select: { firstName: true, lastName: true, avatar: true } },
        contracts: {
          where: { freelancerId: userId },
          take: 1,
          select: { freelancer: { select: { firstName: true, lastName: true, avatar: true } } }
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // Get stats
    let activeProjects = 0
    let completedProjects = 0

    if (isFreelancer) {
      activeProjects = await prisma.project.count({
        where: {
          contracts: {
            some: {
              freelancerId: userId,
              status: 'ACTIVE'
            }
          },
          status: 'IN_PROGRESS',
        },
      })
      completedProjects = await prisma.project.count({
        where: {
          contracts: {
            some: {
              freelancerId: userId,
              status: 'COMPLETED'
            }
          },
          status: 'COMPLETED',
        },
      })
    } else {
      activeProjects = await prisma.project.count({
        where: { clientId: userId, status: 'IN_PROGRESS' },
      })
      completedProjects = await prisma.project.count({
        where: { clientId: userId, status: 'COMPLETED' },
      })
    }

    const totalProjects = activeProjects + completedProjects
    const completionRate = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100) 
      : 0

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { walletId: wallet?.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Get recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      kycStatus: user?.kycStatus,
      wallet,
      recentProjects: recentProjects.map(p => ({
        id: p.id,
        title: p.title,
        budget: p.fixedPrice || p.budgetMax,
        status: p.status,
        client: p.client,
        freelancer: p.contracts?.[0]?.freelancer,
      })),
      activeProjects,
      completedProjects,
      completionRate,
      totalEarned: wallet?.totalEarned || 0,
      totalSpent: wallet?.totalSpent || 0,
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
      recentNotifications: recentNotifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title || n.body,
        createdAt: n.createdAt,
        read: n.read,
      })),
      stats: {
        activeCount: activeProjects,
        totalValue: wallet?.totalEarned || 0,
        percentage: completionRate,
        balance: wallet?.availableBalance || 0,
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
