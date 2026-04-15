'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'

async function fetchSessions() {
  const res = await fetch('/api/sessions')
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export default function SessionsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('upcoming')

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })

  const isFreelancer = session?.user?.role === 'FREELANCER'

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold">Sessions</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isFreelancer && 'Manage your consultation sessions and availability'}
            {'Manage your 1v1 sessions'}
          </p>
        </div>
        
        {isFreelancer && (
          <Button asChild className="bg-cyan-500 hover:bg-cyan-600">
            <Link href="/sessions/availability">
              <Icons.calendar className="mr-2 h-4 w-4" />
              Manage Availability
            </Link>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="upcoming">
            <Icons.calendar className="mr-2 h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past">
            <Icons.history className="mr-2 h-4 w-4" />
            Past
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Icons.search className="mr-2 h-4 w-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : data?.upcoming?.length > 0 ? (
            <div className="space-y-4">
              {data.upcoming.map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={session.otherUser?.avatar} />
                          <AvatarFallback>{session.otherUser?.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {session.otherUser?.firstName} {session.otherUser?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{new Date(session.startTime).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{session.duration} minutes</p>
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/sessions/${session.id}`}>
                          Join Session
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Icons.calendar className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No upcoming sessions</h3>
                <Button className="mt-4" onClick={() => setActiveTab('discover')}>
                  Book a Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {data?.past?.length > 0 ? (
            <div className="space-y-4">
              {data.past.map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={session.otherUser?.avatar} />
                          <AvatarFallback>{session.otherUser?.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {session.otherUser?.firstName} {session.otherUser?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{new Date(session.startTime).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No past sessions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Freelancers</CardTitle>
              <CardDescription>Book a 1v1 session for consultation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.availableFreelancers?.map((freelancer: any) => (
                <div key={freelancer.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={freelancer.avatar} />
                      <AvatarFallback>{freelancer.firstName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{freelancer.firstName} {freelancer.lastName}</p>
                      <p className="text-sm text-gray-500">${freelancer.sessionRate}/hour</p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/sessions/book/${freelancer.id}`}>
                      Book
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
