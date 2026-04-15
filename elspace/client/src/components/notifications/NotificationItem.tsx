'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { getTimeAgo, cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: {
    id: string
    type: string
    title: string
    body: string
    read: boolean
    actionUrl?: string
    createdAt: string
    data?: any
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const queryClient = useQueryClient()

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to mark notification as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'PROJECT_INVITE':
      case 'PROPOSAL_ACCEPTED':
        return <Icons.briefcase className="h-5 w-5 text-blue-500" />
      case 'NEW_MESSAGE':
        return <Icons.messageCircle className="h-5 w-5 text-green-500" />
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_SENT':
        return <Icons.wallet className="h-5 w-5 text-amber-500" />
      case 'SESSION_BOOKED':
      case 'SESSION_REMINDER':
        return <Icons.calendar className="h-5 w-5 text-purple-500" />
      case 'POST_LIKED':
      case 'POST_COMMENTED':
        return <Icons.heart className="h-5 w-5 text-red-500" />
      case 'MENTION':
        return <Icons.atSign className="h-5 w-5 text-cyan-500" />
      case 'DISPUTE_CREATED':
      case 'DISPUTE_UPDATED':
        return <Icons.alertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <Icons.bell className="h-5 w-5 text-gray-500" />
    }
  }

  const content = (
    <div
      className={cn(
        'flex items-start space-x-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900',
        !notification.read && 'bg-cyan-50 dark:bg-cyan-950/20'
      )}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        {getNotificationIcon()}
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">{notification.title}</p>
          <div className="flex items-center space-x-2">
            {!notification.read && (
              <Badge variant="secondary" className="h-2 w-2 rounded-full p-0" />
            )}
            <span className="text-xs text-gray-500">{getTimeAgo(notification.createdAt)}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.body}</p>
      </div>
    </div>
  )

  if (notification.actionUrl) {
    return (
      <Link
        href={notification.actionUrl}
        onClick={() => {
          if (!notification.read) {
            markReadMutation.mutate()
          }
        }}
        className="block"
      >
        {content}
      </Link>
    )
  }

  return (
    <div onClick={() => !notification.read && markReadMutation.mutate()}>
      {content}
    </div>
  )
}
