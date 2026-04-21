// client/src/app/api/wallet/withdrawals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const page = req.nextUrl.searchParams.get('page') || '1'
    const limit = req.nextUrl.searchParams.get('limit') || '20'

    const response = await fetch(
      `${process.env.API_URL}/api/wallet/withdrawals?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch withdrawals')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Withdrawals fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const response = await fetch(`${process.env.API_URL}/api/wallet/withdrawal`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Withdrawal request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
