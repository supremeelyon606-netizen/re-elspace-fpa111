import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/database/prisma'
import { z } from 'zod'

const bankAccountSchema = z.object({
  accountHolder: z.string().min(1, 'Account holder name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'BUSINESS']),
  country: z.string().min(1, 'Country is required'),
})

type BankAccountInput = z.infer<typeof bankAccountSchema>

// GET bank accounts
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

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { walletId: wallet.id },
      select: {
        id: true,
        accountHolder: true,
        bankName: true,
        accountNumber: true,
        accountType: true,
        country: true,
        isDefault: true,
        verified: true,
        createdAt: true,
      },
    })

    return NextResponse.json(bankAccounts)
  } catch (error) {
    console.error('Get bank accounts error:', error)
    return NextResponse.json({ message: 'Failed to fetch bank accounts' }, { status: 500 })
  }
}

// POST new bank account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = bankAccountSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        message: 'Invalid bank account data',
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
    const existingAccount = await prisma.bankAccount.findUnique({
      where: {
        walletId_accountNumber: {
          walletId: wallet.id,
          accountNumber: data.accountNumber,
        },
      },
    })

    if (existingAccount) {
      return NextResponse.json({ 
        message: 'This bank account is already registered' 
      }, { status: 409 })
    }

    // Create bank account
    const bankAccount = await prisma.bankAccount.create({
      data: {
        walletId: wallet.id,
        accountHolder: data.accountHolder,
        bankName: data.bankName,
        accountNumber: data.accountNumber, // In production, encrypt this
        bankCode: data.routingNumber || data.swiftCode || null,
        accountType: data.accountType as any,
        country: data.country,
        verified: false, // Would need micro-deposits to verify
        isDefault: await prisma.bankAccount.count({ where: { walletId: wallet.id } }) === 0,
      },
    })

    return NextResponse.json(bankAccount, { status: 201 })
  } catch (error) {
    console.error('Create bank account error:', error)
    return NextResponse.json({ message: 'Failed to add bank account' }, { status: 500 })
  }
}
