'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import Link from 'next/link'

async function fetchProjects(status?: string) {
  const params = status ? `?status=${status}` : ''
  const res = await fetch(`/api/projects${params}`)
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

async function fetchBrowseProjects(filters?: any) {
  const params = new URLSearchParams(filters).toString()
  const res = await fetch(`/api/projects/browse?${params}`)
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { toast } = useToast()

  const isFreelancer = session?.user?.role === 'freelancer'

  const { data: myProjects, isLoading: myLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => fetchProjects(),
    enabled: isFreelancer,
  })

  const { data: browseProjects, isLoading: browseLoading } = useQuery({
    queryKey: ['browse-projects', categoryFilter],
    queryFn: () =>
      fetchBrowseProjects({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined,
      }),
    enabled: !isFreelancer,
  })

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isFreelancer ? 'Manage your projects' : 'Find projects to work on'}
          </p>
        </div>
        {isFreelancer && (
          <Link href="/projects/create">
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <Icons.plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {isFreelancer ? (
        // Freelancer View - My Projects
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {['active', 'completed', 'archived', 'all'].map((status) => (
            <TabsContent key={status} value={status} className="mt-6 space-y-4">
              {myLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : myProjects?.filter((p: any) => (status === 'all' ? true : p.status === status)).length > 0 ? (
                myProjects
                  .filter((p: any) => (status === 'all' ? true : p.status === status))
                  .map((project: any) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="transition hover:shadow-lg">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{project.title}</CardTitle>
                              <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                            </div>
                            <Badge>{project.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <p className="text-sm text-gray-500">Budget</p>
                              <p className="font-bold">{formatCurrency(project.budget)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Timeline</p>
                              <p className="font-bold">{project.timeline}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Proposals</p>
                              <p className="font-bold">{project.proposalCount}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Progress</p>
                              <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-2 rounded-full bg-cyan-500"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Icons.briefcase className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium">No projects found</h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Client View - Browse Projects
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:col-span-2"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="web">Web Development</SelectItem>
                <SelectItem value="mobile">Mobile Development</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {browseLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : browseProjects?.length > 0 ? (
              browseProjects.map((project: any) => (
                <Card key={project.id} className="transition hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/projects/${project.id}`}>
                          <CardTitle className="hover:text-cyan-500">{project.title}</CardTitle>
                        </Link>
                        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{project.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-6">
                      <div>
                        <p className="text-sm text-gray-500">Budget</p>
                        <p className="font-bold text-cyan-600">{formatCurrency(project.budget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Timeline</p>
                        <p className="font-bold">{project.timeline}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Level</p>
                        <p className="font-bold capitalize">{project.level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.clientAvatar} />
                            <AvatarFallback>{getInitials(project.clientName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{project.clientName}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Proposals</p>
                        <p className="font-bold">{project.proposalCount}</p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <Link href={`/projects/${project.id}/apply`}>
                          <Button className="w-full bg-cyan-500 hover:bg-cyan-600">Apply Now</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icons.briefcase className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium">No projects found</h3>
                  <p className="text-gray-500">Try adjusting your search filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
