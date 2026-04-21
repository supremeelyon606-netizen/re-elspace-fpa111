// client/src/app/api/admin/withdrawals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const page = req.nextUrl.searchParams.get('page') || '1'
    const limit = req.nextUrl.searchParams.get('limit') || '20'
    const status = req.nextUrl.searchParams.get('status') || 'PENDING'

    const response = await fetch(
      `${process.env.API_URL}/api/admin/withdrawals?page=${page}&limit=${limit}&status=${status}`,
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
