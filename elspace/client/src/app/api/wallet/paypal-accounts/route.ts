import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/database/prisma'
import { z } from 'zod'

const paypalSchema = z.object({
  email: z.string().email('Valid PayPal email is required'),
})

type PayPalInput = z.infer<typeof paypalSchema>

// GET PayPal accounts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!wallet) {
      return NextResponse.json([])
    }

    const paypalAccounts = await prisma.payPalAccount.findMany({
      where: { walletId: wallet.id },
      select: {
        id: true,
        email: true,
        isDefault: true,
        verified: true,
        createdAt: true,
      },
    })

    return NextResponse.json(paypalAccounts)
  } catch (error) {
    console.error('Get PayPal accounts error:', error)
    return NextResponse.json({ message: 'Failed to fetch PayPal accounts' }, { status: 500 })
  }
}

// POST new PayPal account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = paypalSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        message: 'Invalid PayPal data',
        errors: validated.error.errors 
      }, { status: 400 })
    }

    // Get wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id },
      })
    }

    const data = validated.data

    // Check if account already exists
    const existingAccount = await prisma.payPalAccount.findUnique({
      where: {
        walletId_email: {
          walletId: wallet.id,
          email: data.email,
        },
      },
    })

    if (existingAccount) {
      return NextResponse.json({ 
        message: 'This PayPal account is already registered' 
      }, { status: 409 })
    }

    // Create PayPal account
    const paypalAccount = await prisma.payPalAccount.create({
      data: {
        walletId: wallet.id,
        email: data.email,
        verified: false, // Could be verified via PayPal API
        isDefault: await prisma.payPalAccount.count({ where: { walletId: wallet.id } }) === 0,
      },
    })

    return NextResponse.json(paypalAccount, { status: 201 })
  } catch (error) {
    console.error('Create PayPal account error:', error)
    return NextResponse.json({ message: 'Failed to add PayPal account' }, { status: 500 })
  }
}
