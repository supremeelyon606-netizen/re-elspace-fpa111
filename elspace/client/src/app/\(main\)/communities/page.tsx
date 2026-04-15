'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'

async function fetchCommunities() {
  const res = await fetch('/api/communities')
  if (!res.ok) throw new Error('Failed to fetch communities')
  return res.json()
}

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('discover')

  const { data, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: fetchCommunities,
  })

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold">Communities</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Connect with freelancers and clients in your niche
          </p>
        </div>
        
        <Button asChild className="bg-cyan-500 hover:bg-cyan-600">
          <Link href="/communities/create">
            <Icons.plus className="mr-2 h-4 w-4" />
            Create Community
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="discover">
            <Icons.compass className="mr-2 h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="my-communities">
            <Icons.users className="mr-2 h-4 w-4" />
            My Communities
          </TabsTrigger>
          <TabsTrigger value="trending">
            <Icons.trendingUp className="mr-2 h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <div className="mb-6">
            <div className="relative">
              <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.communities?.map((community: any) => (
                <Link key={community.id} href={`/communities/${community.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={community.avatar} />
                          <AvatarFallback>{community.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{community.name}</h3>
                          <p className="text-xs text-gray-500">{community.membersCount} members</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {community.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-communities" className="mt-6">
          {data?.myCommunities?.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.myCommunities.map((community: any) => (
                <Link key={community.id} href={`/communities/${community.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={community.avatar} />
                          <AvatarFallback>{community.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{community.name}</h3>
                          <p className="text-xs text-gray-500">{community.membersCount} members</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Member</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Icons.users className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No communities yet</h3>
                <Button className="mt-4" onClick={() => setActiveTab('discover')}>
                  Join a Community
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.trendingCommunities?.map((community: any) => (
              <Link key={community.id} href={`/communities/${community.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={community.avatar} />
                        <AvatarFallback>{community.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center text-sm text-amber-500">
                        <Icons.trendingUp className="h-4 w-4 mr-1" />
                        Trending
                      </div>
                    </div>
                    <h3 className="font-medium mb-2">{community.name}</h3>
                    <p className="text-xs text-gray-500">{community.membersCount} members</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
