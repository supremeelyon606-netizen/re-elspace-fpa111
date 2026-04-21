import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/database/prisma'
import { z } from 'zod'

const cryptoWalletSchema = z.object({
  address: z.string().min(26, 'Valid wallet address is required'),
  network: z.enum(['ETH', 'BTC', 'USDT', 'USDC']),
  label: z.string().optional(),
})

type CryptoWalletInput = z.infer<typeof cryptoWalletSchema>

// GET crypto wallets
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

    const cryptoWallets = await prisma.cryptoWallet.findMany({
      where: { walletId: wallet.id },
      select: {
        id: true,
        address: true,
        network: true,
        label: true,
        isDefault: true,
        verified: true,
        createdAt: true,
      },
    })

    return NextResponse.json(cryptoWallets)
  } catch (error) {
    console.error('Get crypto wallets error:', error)
    return NextResponse.json({ message: 'Failed to fetch crypto wallets' }, { status: 500 })
  }
}

// POST new crypto wallet
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = cryptoWalletSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        message: 'Invalid crypto wallet data',
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

    // Validate address format based on network (basic validation)
    if (data.network === 'ETH' || data.network === 'USDT' || data.network === 'USDC') {
      if (!data.address.startsWith('0x') && !data.address.startsWith('0x')) {
        return NextResponse.json({ 
          message: 'Invalid Ethereum address format (must start with 0x)' 
        }, { status: 400 })
      }
    } else if (data.network === 'BTC') {
      if (!['1', '3', 'b'].includes(data.address[0])) {
        return NextResponse.json({ 
          message: 'Invalid Bitcoin address format' 
        }, { status: 400 })
      }
    }

    // Check if wallet already exists
    const existingWallet = await prisma.cryptoWallet.findUnique({
      where: { 
        address: data.address,
      },
    })

    if (existingWallet) {
      if (existingWallet.walletId === wallet.id) {
        return NextResponse.json({ 
          message: 'This wallet is already registered' 
        }, { status: 409 })
      } else {
        return NextResponse.json({ 
          message: 'This address is already registered by another user' 
        }, { status: 409 })
      }
    }

    // Create crypto wallet
    const cryptoWallet = await prisma.cryptoWallet.create({
      data: {
        walletId: wallet.id,
        address: data.address,
        network: data.network,
        label: data.label || null,
        verified: false,
        isDefault: await prisma.cryptoWallet.count({ where: { walletId: wallet.id } }) === 0,
      },
    })

    return NextResponse.json(cryptoWallet, { status: 201 })
  } catch (error) {
    console.error('Create crypto wallet error:', error)
    return NextResponse.json({ message: 'Failed to add crypto wallet' }, { status: 500 })
  }
}
