import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/database/prisma'
import { z } from 'zod'

const submitSchema = z.object({
  legalFirstName: z.string().min(1),
  legalLastName: z.string().min(1),
  dateOfBirth: z.string(),
  documentType: z.enum(['DRIVERS_LICENSE', 'NATIONAL_ID', 'VOTERS_CARD', 'RESIDENT_PERMIT', 'PASSPORT']),
  documentNumber: z.string().min(3),
  country: z.string().min(1),
  residentPermitNumber: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    
    const legalFirstName = formData.get('legalFirstName') as string
    const legalLastName = formData.get('legalLastName') as string
    const dateOfBirth = new Date(formData.get('dateOfBirth') as string)
    const documentType = formData.get('documentType') as string
    const documentNumber = formData.get('documentNumber') as string
    const country = formData.get('country') as string
    const residentPermitNumber = (formData.get('residentPermitNumber') as string) || null

    // Validate data
    const validated = submitSchema.safeParse({
      legalFirstName,
      legalLastName,
      dateOfBirth: dateOfBirth.toISOString(),
      documentType,
      documentNumber,
      country,
      residentPermitNumber,
    })

    if (!validated.success) {
      return NextResponse.json({ 
        error: 'Invalid submission data',
        details: validated.error.errors 
      }, { status: 400 })
    }

    // Validate age
    const today = new Date()
    const age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate()) 
      ? age - 1 
      : age
    
    if (adjustedAge < 18) {
      return NextResponse.json({ 
        message: 'You must be at least 18 years old' 
      }, { status: 400 })
    }

    // Get files
    const documentFront = formData.get('documentFront') as File | null
    const documentBack = (formData.get('documentBack') as File) || null
    const documentSelfie = (formData.get('documentSelfie') as File) || null
    const videoVerification = formData.get('videoVerification') as File | null

    if (!documentFront || !videoVerification) {
      return NextResponse.json({ 
        message: 'Document front and video verification are required' 
      }, { status: 400 })
    }

    // For demo purposes, store URLs as relative paths (in production, upload to S3/Cloudinary)
    const documentFrontUrl = `/uploads/kyc/${session.user.id}-front-${Date.now()}.jpg`
    const documentBackUrl = documentBack ? `/uploads/kyc/${session.user.id}-back-${Date.now()}.jpg` : null
    const documentSelfieUrl = documentSelfie ? `/uploads/kyc/${session.user.id}-selfie-${Date.now()}.jpg` : null
    const videoUrl = `/uploads/kyc/${session.user.id}-video-${Date.now()}.webm`

    // Create KYC verification record
    const kycVerification = await prisma.kYCVerification.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        documentType: documentType as any,
        documentNumber: documentNumber, // In production, encrypt this
        documentFront: documentFrontUrl,
        documentBack: documentBackUrl,
        documentSelfie: documentSelfieUrl,
        videoUrl: videoUrl,
        fullName: `${legalFirstName} ${legalLastName}`,
        dateOfBirth,
        country,
        residentPermitNumber: residentPermitNumber || undefined,
        ageVerified: adjustedAge >= 18,
      },
    })

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date(),
        legalFirstName,
        legalLastName,
        dateOfBirth,
        idDocumentType: documentType as any,
        idDocumentNumber: documentNumber, // In production, encrypt this
        country,
        residentPermitNumber: residentPermitNumber || undefined,
      },
    })

    // TODO: Send notification to admin for review

    return NextResponse.json({ 
      success: true, 
      verificationId: kycVerification.id,
      message: 'KYC submitted successfully. We will review it within 24-48 hours.'
    }, { status: 201 })
  } catch (error) {
    console.error('KYC submission error:', error)
    return NextResponse.json({ 
      message: 'Failed to submit KYC verification' 
    }, { status: 500 })
  }
}
