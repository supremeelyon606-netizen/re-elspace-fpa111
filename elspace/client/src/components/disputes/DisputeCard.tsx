'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Icons } from '@/components/ui/icons'
import { formatDate, formatCurrency } from '@/lib/utils'

interface DisputeCardProps {
  dispute: {
    id: string
    disputeId: string
    type: string
    reason: string
    status: string
    priority: string
    createdAt: string
    project?: {
      id: string
      title: string
      budget: number
    }
    initiator?: {
      firstName: string
      lastName: string
      avatar: string
    }
    respondent?: {
      firstName: string
      lastName: string
      avatar: string
    }
    escrowAmount?: number
  }
  isResolved?: boolean
}

export function DisputeCard({ dispute, isResolved = false }: DisputeCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <Icons.alertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <Link 
                  href={`/disputes/${dispute.id}`}
                  className="font-space-grotesk text-lg font-bold hover:text-cyan-500"
                >
                  Dispute #{dispute.disputeId}
                </Link>
                <Badge variant={
                  dispute.status === 'OPEN' ? 'warning' :
                  dispute.status === 'UNDER_REVIEW' ? 'secondary' :
                  dispute.status === 'RESOLVED' ? 'success' : 'destructive'
                }>
                  {dispute.status}
                </Badge>
                <Badge variant={
                  dispute.priority === 'URGENT' ? 'destructive' : 
                  dispute.priority === 'HIGH' ? 'warning' : 'secondary'
                }>
                  {dispute.priority}
                </Badge>
              </div>
              
              <p className="mt-1 text-sm text-gray-500">
                {dispute.type} • Opened {formatDate(dispute.createdAt)}
              </p>
              
              {dispute.project && (
                <Link 
                  href={`/projects/${dispute.project.id}`}
                  className="mt-2 block text-sm hover:text-cyan-500"
                >
                  <span className="font-medium">Project:</span> {dispute.project.title}
                </Link>
              )}
              
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {dispute.reason}
              </p>
            </div>
          </div>

          {!isResolved && (
            <Button asChild>
              <Link href={`/disputes/${dispute.id}`}>
                View Details
                <Icons.chevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {!isResolved && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={dispute.initiator?.avatar} />
                  <AvatarFallback>{dispute.initiator?.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {dispute.initiator?.firstName} {dispute.initiator?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Initiator</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={dispute.respondent?.avatar} />
                  <AvatarFallback>{dispute.respondent?.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {dispute.respondent?.firstName} {dispute.respondent?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Respondent</p>
                </div>
              </div>
            </div>

            {dispute.escrowAmount && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Amount in Escrow</span>
                  <span className="font-medium">{formatCurrency(dispute.escrowAmount)}</span>
                </div>
                <Progress value={50} className="mt-2" />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
