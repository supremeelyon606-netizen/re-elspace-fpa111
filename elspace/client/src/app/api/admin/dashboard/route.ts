// client/src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetch(`${process.env.API_URL}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
