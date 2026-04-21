// client/src/app/api/admin/withdrawals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, notes, reason } = await req.json()
    const withdrawalId = params.id

    let url = ''
    let body: any = {}

    if (action === 'approve') {
      url = `${process.env.API_URL}/api/admin/withdrawals/${withdrawalId}/approve`
      body = { notes }
    } else if (action === 'reject') {
      url = `${process.env.API_URL}/api/admin/withdrawals/${withdrawalId}/reject`
      body = { reason }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = await fetch(url, {
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
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Withdrawal action error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
