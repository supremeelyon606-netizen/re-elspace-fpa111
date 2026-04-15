'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icons } from '@/components/ui/icons'
import Link from 'next/link'

async function fetchDashboardData() {
  const res = await fetch('/api/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  })

  const isFreelancer = session?.user?.role === 'FREELANCER'
  const isClient = session?.user?.role === 'CLIENT'

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      {/* Welcome Header */}
      <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold">
            Welcome back, {session?.user?.firstName || 'there'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isFreelancer && 'Here\'s what\'s happening with your freelance business today.'}
            {isClient && 'Ready to find your next great hire?'}
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0">
          {isFreelancer && (
            <Button asChild className="bg-cyan-500 hover:bg-cyan-600">
              <Link href="/projects">
                <Icons.search className="mr-2 h-4 w-4" />
                Find Projects
              </Link>
            </Button>
          )}
          {isClient && (
            <Button asChild className="bg-amber-500 hover:bg-amber-600">
              <Link href="/projects/post">
                <Icons.plus className="mr-2 h-4 w-4" />
                Post a Project
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: isFreelancer ? 'Active Proposals' : 'Active Projects', value: data?.stats?.activeCount || 0 },
          { label: isFreelancer ? 'Total Earnings' : 'Total Spent', value: `$${data?.stats?.totalValue || 0}` },
          { label: isFreelancer ? 'Completion Rate' : 'Hire Rate', value: `${data?.stats?.percentage || 0}%` },
          { label: 'Balance', value: `$${data?.stats?.balance || 0}` },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest projects and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.recentProjects?.length > 0 ? (
                    <div className="space-y-4">
                      {data.recentProjects.map((project: any) => (
                        <div key={project.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <Link href={`/projects/${project.id}`} className="font-medium hover:text-cyan-500">
                              {project.title}
                            </Link>
                            <p className="text-sm text-gray-500">{project.status}</p>
                          </div>
                          <Badge>{project.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No recent activity</p>
                  )}
                </CardContent>
              </Card>

              {isFreelancer && data?.proposals?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Proposals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.proposals.slice(0, 5).map((proposal: any) => (
                        <div key={proposal.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{proposal.projectTitle}</p>
                            <p className="text-sm text-gray-500">Bid: ${proposal.bidAmount}</p>
                          </div>
                          <Badge>{proposal.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isFreelancer && (
                    <>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/profile/edit">
                          <Icons.user className="mr-2 h-4 w-4" />
                          Update Profile
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/wallet">
                          <Icons.wallet className="mr-2 h-4 w-4" />
                          View Wallet
                        </Link>
                      </Button>
                    </>
                  )}
                  {isClient && (
                    <>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/freelancers/saved">
                          <Icons.bookmark className="mr-2 h-4 w-4" />
                          Saved Freelancers
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/wallet/deposit">
                          <Icons.creditCard className="mr-2 h-4 w-4" />
                          Add Funds
                        </Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Icons.helpCircle className="mr-2 h-4 w-4" />
                    View Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Projects list loading...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/messages">Go to Messages</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
