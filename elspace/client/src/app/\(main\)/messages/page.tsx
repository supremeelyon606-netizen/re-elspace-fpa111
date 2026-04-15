'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'
import { getTimeAgo, getInitials } from '@/lib/utils'
import Link from 'next/link'

async function fetchConversations() {
  const res = await fetch('/api/messages/conversations')
  if (!res.ok) throw new Error('Failed to fetch conversations')
  return res.json()
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  })

  const filteredConversations = conversations?.filter((conv: any) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold">Messages</h1>
        <p className="text-gray-500 dark:text-gray-400">Direct messaging with your connections</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Sidebar with conversation list */}
        <div className="md:col-span-1">
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icons.spinner className="h-6 w-6 animate-spin text-cyan-500" />
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv: any) => (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className="block rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.participantAvatar} />
                        <AvatarFallback>{getInitials(conv.participantName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{conv.participantName}</p>
                        <p className="truncate text-xs text-gray-500">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-cyan-500 text-xs font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Icons.inbox className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-4 text-sm text-gray-500">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Main message area */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Select a conversation</CardTitle>
              <CardDescription>Choose a conversation from the list to start messaging</CardDescription>
            </CardHeader>
            <CardContent className="flex h-96 items-center justify-center">
              <div className="text-center">
                <Icons.messageSquare className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">Select a conversation to begin</p>
                <p className="text-sm text-gray-400">Your messages will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Recent Activity</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConversations.slice(0, 3).map((conv: any) => (
            <Card key={conv.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={conv.participantAvatar} />
                    <AvatarFallback>{getInitials(conv.participantName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{conv.participantName}</p>
                    <p className="text-xs text-gray-500">{getTimeAgo(conv.lastMessageTime)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{conv.lastMessage}</p>
                <Link href={`/messages/${conv.id}`}>
                  <Button className="mt-4 w-full bg-cyan-500 hover:bg-cyan-600">
                    Open Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
