'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'

async function fetchFeed(filter: string = 'for-you') {
  const res = await fetch(`/api/feed?filter=${filter}`)
  if (!res.ok) throw new Error('Failed to fetch feed')
  return res.json()
}

export default function FeedPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('for-you')
  const [postContent, setPostContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['feed', activeTab],
    queryFn: () => fetchFeed(activeTab),
  })

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/feed/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to create post')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      setPostContent('')
      toast({
        title: 'Post Created',
        description: 'Your post has been published',
        variant: 'success',
      })
    },
  })

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold">Feed</h1>
        <p className="text-gray-500 dark:text-gray-400">
          See what's happening in the EL SPACE community
        </p>
      </div>

      {/* Create Post */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session?.user?.avatar} />
              <AvatarFallback>{session?.user?.firstName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share your thoughts, wins, or questions..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={3}
                className="resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Icons.image className="mr-2 h-4 w-4" />
                    Photo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Icons.link className="mr-2 h-4 w-4" />
                    Link
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => createPostMutation.mutate(postContent)}
                  disabled={!postContent.trim() || createPostMutation.isPending}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {createPostMutation.isPending ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="mt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : data?.posts?.length > 0 ? (
            <div className="space-y-4">
              {data.posts.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.avatar} />
                        <AvatarFallback>{post.author?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Link href={`/profile/${post.author?.id}`} className="hover:underline">
                          <p className="font-medium">
                            {post.author?.firstName} {post.author?.lastName}
                          </p>
                        </Link>
                        <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">{post.content}</p>
                        <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                          <button className="hover:text-cyan-500">
                            <Icons.heart className="mr-1 inline h-4 w-4" />
                            {post.likesCount}
                          </button>
                          <button className="hover:text-cyan-500">
                            <Icons.messageCircle className="mr-1 inline h-4 w-4" />
                            {post.commentsCount}
                          </button>
                          <button className="hover:text-cyan-500">
                            <Icons.share className="mr-1 inline h-4 w-4" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Icons.inbox className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No posts yet</h3>
                <p className="text-gray-500">Follow more people to see their posts</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          {data?.posts?.length > 0 ? (
            <div className="space-y-4">
              {data.posts.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.avatar} />
                        <AvatarFallback>{post.author?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{post.author?.firstName} {post.author?.lastName}</p>
                        <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                        <p className="mt-2">{post.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="space-y-4">
            {data?.trendingPosts?.map((post: any) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author?.avatar} />
                      <AvatarFallback>{post.author?.firstName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{post.author?.firstName} {post.author?.lastName}</p>
                      <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                      <p className="mt-2">{post.content}</p>
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
