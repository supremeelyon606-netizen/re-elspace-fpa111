'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/components/ui/use-toast'
import { formatNumber } from '@/lib/utils'

interface CommunityCardProps {
  community: {
    id: string
    name: string
    slug: string
    description: string
    avatar: string
    coverImage: string
    type: string
    membersCount: number
    postsCount: number
    isMember?: boolean
    owner: {
      firstName: string
      lastName: string
      avatar: string
    }
  }
  isMember?: boolean
}

export function CommunityCard({ community, isMember: initialIsMember }: CommunityCardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isMember = initialIsMember || community.isMember

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to join community')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      toast({
        title: 'Joined!',
        description: `You are now a member of ${community.name}`,
      })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${community.id}/leave`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to leave community')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      toast({
        title: 'Left Community',
        description: `You have left ${community.name}`,
      })
    },
  })

  return (
    <Card className="overflow-hidden">
      <div className="relative h-24 bg-gradient-to-r from-cyan-500 to-indigo-600">
        {community.coverImage && (
          <img
            src={community.coverImage}
            alt={community.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      
      <CardHeader className="relative pb-2">
        <Avatar className="absolute -top-8 h-16 w-16 border-4 border-white dark:border-gray-950">
          <AvatarImage src={community.avatar} />
          <AvatarFallback className="text-xl">{community.name[0]}</AvatarFallback>
        </Avatar>
        <div className="mt-6">
          <Link href={`/communities/${community.id}`}>
            <h3 className="font-space-grotesk text-lg font-bold hover:text-cyan-500">
              {community.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500">@{community.slug}</p>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
          {community.description}
        </p>
        
        <div className="mt-3 flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <Icons.users className="mr-1 h-4 w-4 text-gray-400" />
            <span>{formatNumber(community.membersCount)} members</span>
          </div>
          <div className="flex items-center">
            <Icons.messageCircle className="mr-1 h-4 w-4 text-gray-400" />
            <span>{formatNumber(community.postsCount)} posts</span>
          </div>
        </div>

        <div className="mt-2 flex items-center space-x-2">
          <Badge variant={community.type === 'PUBLIC' ? 'secondary' : 'outline'}>
            {community.type}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={community.owner.avatar} />
            <AvatarFallback>{community.owner.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500">
            by {community.owner.firstName}
          </span>
        </div>

        {session?.user && (
          isMember ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? (
                <Icons.spinner className="mr-2 h-3 w-3 animate-spin" />
              ) : null}
              Leave
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {joinMutation.isPending ? (
                <Icons.spinner className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Icons.userPlus className="mr-2 h-3 w-3" />
              )}
              Join
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  )
}
