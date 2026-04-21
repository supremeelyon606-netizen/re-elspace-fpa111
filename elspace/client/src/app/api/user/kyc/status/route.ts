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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        kycStatus: true,
        kycSubmittedAt: true,
        kycVerifiedAt: true,
        legalFirstName: true,
        legalLastName: true,
        dateOfBirth: true,
        idDocumentType: true,
        country: true,
        kycRejectionReason: true,
      },
    })

    const latestKYC = await prisma.kYCVerification.findFirst({
      where: { userId: session.user.id },
      orderBy: { submittedAt: 'desc' },
      select: {
        status: true,
        rejectionReason: true,
      },
    })

    return NextResponse.json({
      status: user?.kycStatus || 'NOT_SUBMITTED',
      submittedAt: user?.kycSubmittedAt,
      verifiedAt: user?.kycVerifiedAt,
      documentType: user?.idDocumentType,
      rejectionReason: latestKYC?.rejectionReason || user?.kycRejectionReason,
      fullName: user?.legalFirstName && user?.legalLastName 
        ? `${user.legalFirstName} ${user.legalLastName}`
        : null,
    })
  } catch (error) {
    console.error('KYC status error:', error)
    return NextResponse.json({ error: 'Failed to fetch KYC status' }, { status: 500 })
  }
}
