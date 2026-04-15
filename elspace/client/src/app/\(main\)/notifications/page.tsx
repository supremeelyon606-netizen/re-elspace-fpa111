'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'

async function fetchNotifications() {
  const res = await fetch('/api/notifications')
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to mark notifications as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast({
        title: 'All notifications marked as read',
        variant: 'success',
      })
    },
  })

  const unreadCount = data?.notifications?.filter((n: any) => !n.read).length || 0

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">Stay updated on your activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllReadMutation.mutate()}>
            <Icons.check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : data?.notifications?.length > 0 ? (
            <div className="space-y-2">
              {data.notifications.map((notification: any) => (
                <Card key={notification.id} className={notification.read ? '' : 'bg-cyan-50 dark:bg-cyan-950/20'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.actor?.avatar} />
                        <AvatarFallback>{notification.actor?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-sm text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!notification.read && (
                        <div className="h-3 w-3 rounded-full bg-cyan-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Icons.bell className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <div className="space-y-2">
            {data?.notifications?.filter((n: any) => !n.read).map((notification: any) => (
              <Card key={notification.id} className="bg-cyan-50 dark:bg-cyan-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.actor?.avatar} />
                      <AvatarFallback>{notification.actor?.firstName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{notification.message}</p>
                      <p className="text-sm text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="space-y-2">
            {data?.notifications?.filter((n: any) => n.type === 'SYSTEM').map((notification: any) => (
              <Card key={notification.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Icons.alertCircle className="h-10 w-10 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-medium">{notification.message}</p>
                      <p className="text-sm text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
