'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatTime, formatDuration, formatCurrency } from '@/lib/utils'

interface SessionCardProps {
  session: {
    id: string
    bookingId: string
    title: string
    type: string
    status: string
    startTime: string
    endTime: string
    duration: number
    price?: number
    currency?: string
    roomUrl?: string
    recordingUrl?: string
    client: {
      id: string
      firstName: string
      lastName: string
      avatar: string
    }
    freelancer: {
      id: string
      firstName: string
      lastName: string
      avatar: string
    }
  }
  isPast?: boolean
}

export function SessionCard({ session: sessionData, isPast = false }: SessionCardProps) {
  const { data: userSession } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const isFreelancer = userSession?.user?.role === 'FREELANCER'
  const otherUser = userSession?.user?.id === sessionData.client?.id 
    ? sessionData.freelancer 
    : sessionData.client

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sessions/${sessionData.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })
      if (!res.ok) throw new Error('Failed to cancel session')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast({
        title: 'Session Cancelled',
        description: 'The session has been cancelled successfully.',
      })
      setShowCancelDialog(false)
    },
  })

  const joinSession = () => {
    if (sessionData.roomUrl) {
      window.open(sessionData.roomUrl, '_blank')
    }
  }

  const canCancel = !isPast && 
    sessionData.status !== 'CANCELLED' && 
    sessionData.status !== 'COMPLETED' &&
    new Date(sessionData.startTime) > new Date(Date.now() + 24 * 60 * 60 * 1000)

  const canJoin = !isPast && 
    sessionData.status === 'CONFIRMED' &&
    new Date(sessionData.startTime) <= new Date() &&
    new Date(sessionData.endTime) >= new Date()

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar} />
                <AvatarFallback>{otherUser?.firstName?.[0]}</AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center space-x-3">
                  <h4 className="font-semibold">{sessionData.title}</h4>
                  <Badge variant={
                    sessionData.status === 'CONFIRMED' ? 'success' :
                    sessionData.status === 'PENDING' ? 'warning' :
                    sessionData.status === 'COMPLETED' ? 'secondary' :
                    'destructive'
                  }>
                    {sessionData.status}
                  </Badge>
                  <Badge variant="outline">{sessionData.type}</Badge>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  with {otherUser?.firstName} {otherUser?.lastName}
                </p>

                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Icons.calendar className="mr-1 h-4 w-4 text-gray-400" />
                    {formatDate(sessionData.startTime)}
                  </div>
                  <div className="flex items-center">
                    <Icons.clock className="mr-1 h-4 w-4 text-gray-400" />
                    {formatTime(sessionData.startTime)} - {formatTime(sessionData.endTime)}
                  </div>
                  <div className="flex items-center">
                    <Icons.hourglass className="mr-1 h-4 w-4 text-gray-400" />
                    {formatDuration(sessionData.duration)}
                  </div>
                </div>

                {sessionData.price && sessionData.price > 0 && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{formatCurrency(sessionData.price, sessionData.currency)}</span>
                    <span className="text-gray-500"> • {isFreelancer ? 'You earn' : 'Total'}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canJoin && (
                <Button onClick={joinSession} className="bg-green-500 hover:bg-green-600">
                  <Icons.video className="mr-2 h-4 w-4" />
                  Join Session
                </Button>
              )}
              
              {!isPast && sessionData.status === 'COMPLETED' && sessionData.recordingUrl && (
                <Button variant="outline" asChild>
                  <a href={sessionData.recordingUrl} target="_blank" rel="noopener noreferrer">
                    <Icons.play className="mr-2 h-4 w-4" />
                    Watch Recording
                  </a>
                </Button>
              )}

              {canCancel && (
                <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                  Cancel
                </Button>
              )}

              <Button variant="ghost" size="icon" asChild>
                <Link href={`/sessions/${sessionData.id}`}>
                  <Icons.chevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this session? 
              {sessionData.price && sessionData.price > 0 && !isFreelancer && (
                <span className="mt-2 block text-amber-600">
                  Note: Cancellations within 24 hours may not be refunded.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for cancellation (optional)</Label>
              <Textarea
                placeholder="Please let the other party know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Session
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cancel Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
