'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { formatCurrency, formatNumber, formatDate, getTimeAgo } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

async function fetchAdminDashboard() {
  const res = await fetch('/api/admin/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}

async function fetchAdminUsers(page: number = 1, filter: string = 'all') {
  const res = await fetch(`/api/admin/users?page=${page}&filter=${filter}`)
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

async function fetchAdminProjects(page: number = 1, status: string = 'all') {
  const res = await fetch(`/api/admin/projects?page=${page}&status=${status}`)
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

async function fetchAdminTransactions(page: number = 1) {
  const res = await fetch(`/api/admin/transactions?page=${page}`)
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

async function fetchAdminDisputes(page: number = 1) {
  const res = await fetch(`/api/admin/disputes?page=${page}`)
  if (!res.ok) throw new Error('Failed to fetch disputes')
  return res.json()
}

const COLORS = ['#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [userFilter, setUserFilter] = useState('all')
  const [projectStatus, setProjectStatus] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [projectPage, setProjectPage] = useState(1)
  const [transactionPage, setTransactionPage] = useState(1)
  const [disputePage, setDisputePage] = useState(1)

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    enabled: session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR',
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userPage, userFilter],
    queryFn: () => fetchAdminUsers(userPage, userFilter),
    enabled: (session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR') && activeTab === 'users',
  })

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects', projectPage, projectStatus],
    queryFn: () => fetchAdminProjects(projectPage, projectStatus),
    enabled: (session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR') && activeTab === 'projects',
  })

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions', transactionPage],
    queryFn: () => fetchAdminTransactions(transactionPage),
    enabled: (session?.user?.role === 'ADMIN') && activeTab === 'transactions',
  })

  const { data: disputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['admin-disputes', disputePage],
    queryFn: () => fetchAdminDisputes(disputePage),
    enabled: (session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR') && activeTab === 'disputes',
  })

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MODERATOR') {
    redirect('/dashboard')
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space-grotesk text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage users, projects, transactions, and platform settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={session?.user?.role === 'ADMIN' ? 'destructive' : 'secondary'}>
            {session?.user?.role}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          {isAdmin && <TabsTrigger value="transactions">Transactions</TabsTrigger>}
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {dashboardLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Users</CardDescription>
                    <CardTitle className="text-3xl">{formatNumber(dashboardData?.stats?.totalUsers || 0)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm">
                      <span className="text-green-500 flex items-center">
                        <Icons.trendingUp className="mr-1 h-4 w-4" />
                        +{dashboardData?.stats?.newUsersThisMonth || 0}
                      </span>
                      <span className="ml-2 text-gray-500">this month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Active Projects</CardDescription>
                    <CardTitle className="text-3xl">{formatNumber(dashboardData?.stats?.activeProjects || 0)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500">{formatNumber(dashboardData?.stats?.completedProjects || 0)} completed</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Platform Revenue</CardDescription>
                    <CardTitle className="text-3xl">{formatCurrency(dashboardData?.stats?.totalRevenue || 0)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm">
                      <span className="text-green-500 flex items-center">
                        <Icons.trendingUp className="mr-1 h-4 w-4" />
                        +{dashboardData?.stats?.revenueGrowth || 0}%
                      </span>
                      <span className="ml-2 text-gray-500">vs last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Open Disputes</CardDescription>
                    <CardTitle className="text-3xl">{formatNumber(dashboardData?.stats?.openDisputes || 0)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm">
                      <span className={`${dashboardData?.stats?.openDisputes > 5 ? 'text-red-500' : 'text-green-500'}`}>
                        {dashboardData?.stats?.openDisputes > 5 ? 'Needs attention' : 'Normal'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New users over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dashboardData?.userGrowth || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="freelancers" stroke="#06B6D4" />
                        <Line type="monotone" dataKey="clients" stroke="#F59E0B" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Platform fees collected</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardData?.revenueData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#06B6D4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>By role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={dashboardData?.userDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(dashboardData?.userDistribution || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Categories</CardTitle>
                    <CardDescription>Most popular categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={dashboardData?.categoryDistribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name }) => name}
                        >
                          {(dashboardData?.categoryDistribution || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.recentActivity?.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.user?.avatar} />
                            <AvatarFallback>{activity.user?.firstName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">{activity.user?.firstName}</span>
                              {' '}{activity.action}
                            </p>
                            <p className="text-xs text-gray-500">{getTimeAgo(activity.createdAt)}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{activity.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage platform users</CardDescription>
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="FREELANCER">Freelancers</SelectItem>
                    <SelectItem value="CLIENT">Clients</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Spent/Earned</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'ACTIVE' ? 'success' : 'warning'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>{user.projectsCount || 0}</TableCell>
                          <TableCell>{formatCurrency(user.totalAmount || 0)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Icons.moreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/profile/${user.id}`}>
                                    <Icons.user className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Icons.edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                {user.status === 'ACTIVE' ? (
                                  <DropdownMenuItem className="text-yellow-500">
                                    <Icons.alertCircle className="mr-2 h-4 w-4" />
                                    Suspend
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="text-green-500">
                                    <Icons.checkCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-red-500">
                                  <Icons.ban className="mr-2 h-4 w-4" />
                                  Ban User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {usersData?.pagination && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Showing {usersData.pagination.start} - {usersData.pagination.end} of {usersData.pagination.total} users
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!usersData.pagination.hasPrev}
                          onClick={() => setUserPage(userPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!usersData.pagination.hasNext}
                          onClick={() => setUserPage(userPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Management</CardTitle>
                  <CardDescription>Monitor and moderate all projects</CardDescription>
                </div>
                <Select value={projectStatus} onValueChange={setProjectStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Freelancer</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectsData?.projects?.map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{project.title}</p>
                              <p className="text-sm text-gray-500">{project.category}</p>
                            </div>
                          </TableCell>
                          <TableCell>{project.client?.firstName} {project.client?.lastName}</TableCell>
                          <TableCell>
                            {project.freelancer 
                              ? `${project.freelancer?.firstName} ${project.freelancer?.lastName}`
                              : <span className="text-gray-400">Not assigned</span>
                            }
                          </TableCell>
                          <TableCell>{formatCurrency(project.budget)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              project.status === 'COMPLETED' ? 'success' :
                              project.status === 'DISPUTED' ? 'destructive' :
                              project.status === 'IN_PROGRESS' ? 'warning' :
                              'secondary'
                            }>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(project.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Icons.moreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/projects/${project.id}`}>
                                    <Icons.eye className="mr-2 h-4 w-4" />
                                    View Project
                                  </Link>
                                </DropdownMenuItem>
                                {project.status === 'DISPUTED' && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/disputes/${project.disputeId}`}>
                                      <Icons.shield className="mr-2 h-4 w-4" />
                                      View Dispute
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-red-500">
                                  <Icons.trash className="mr-2 h-4 w-4" />
                                  Cancel Project
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {projectsData?.pagination && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Showing {projectsData.pagination.start} - {projectsData.pagination.end} of {projectsData.pagination.total} projects
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!projectsData.pagination.hasPrev}
                          onClick={() => setProjectPage(projectPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!projectsData.pagination.hasNext}
                          onClick={() => setProjectPage(projectPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All platform financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsData?.transactions?.map((tx: any) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-sm">{tx.transactionId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{tx.type}</Badge>
                            </TableCell>
                            <TableCell>{tx.fromUser?.firstName || 'System'}</TableCell>
                            <TableCell>{tx.toUser?.firstName || 'System'}</TableCell>
                            <TableCell>{formatCurrency(tx.amount)}</TableCell>
                            <TableCell>{formatCurrency(tx.fee || 0)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                tx.status === 'COMPLETED' ? 'success' :
                                tx.status === 'PENDING' ? 'warning' :
                                tx.status === 'FAILED' ? 'destructive' : 'secondary'
                              }>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(tx.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Revenue Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Total Volume</p>
                              <p className="text-2xl font-bold">{formatCurrency(transactionsData?.summary?.totalVolume || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Platform Fees</p>
                              <p className="text-2xl font-bold">{formatCurrency(transactionsData?.summary?.totalFees || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Net Payouts</p>
                              <p className="text-2xl font-bold">{formatCurrency(transactionsData?.summary?.netPayouts || 0)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Resolution</CardTitle>
              <CardDescription>Manage and resolve platform disputes</CardDescription>
            </CardHeader>
            <CardContent>
              {disputesLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispute ID</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Initiated By</TableHead>
                      <TableHead>Respondent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputesData?.disputes?.map((dispute: any) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-mono text-sm">{dispute.disputeId}</TableCell>
                        <TableCell>
                          <Link href={`/projects/${dispute.projectId}`} className="hover:text-cyan-500">
                            {dispute.project?.title}
                          </Link>
                        </TableCell>
                        <TableCell>{dispute.initiator?.firstName} {dispute.initiator?.lastName}</TableCell>
                        <TableCell>{dispute.respondent?.firstName} {dispute.respondent?.lastName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dispute.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            dispute.status === 'RESOLVED' ? 'success' :
                            dispute.status === 'ESCALATED' ? 'destructive' :
                            'warning'
                          }>
                            {dispute.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            dispute.priority === 'URGENT' ? 'destructive' :
                            dispute.priority === 'HIGH' ? 'warning' : 'secondary'
                          }>
                            {dispute.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/disputes/${dispute.id}`}>
                              Review
                              <Icons.chevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-gray-500">Disable platform access for maintenance</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New User Registration</p>
                      <p className="text-sm text-gray-500">Allow new users to sign up</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Platform Fee Percentage</p>
                    <p className="text-xs text-gray-500">Current fee: 7%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>Manage email notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Icons.mail className="mr-2 h-4 w-4" />
                    Welcome Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Icons.mail className="mr-2 h-4 w-4" />
                    Project Match Notification
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Icons.mail className="mr-2 h-4 w-4" />
                    Payment Confirmation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Icons.mail className="mr-2 h-4 w-4" />
                    Dispute Resolution
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Monitor platform performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">API Response Time</p>
                        <Badge variant="secondary">Healthy</Badge>
                      </div>
                      <p className="mt-2 text-2xl font-bold">124ms</p>
                      <Progress value={78} className="mt-2" />
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Database</p>
                        <Badge variant="secondary">Connected</Badge>
                      </div>
                      <p className="mt-2 text-2xl font-bold">PostgreSQL</p>
                      <p className="text-xs text-gray-500">Latency: 8ms</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Storage</p>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <p className="mt-2 text-2xl font-bold">Cloudinary</p>
                      <p className="text-xs text-gray-500">Usage: 45.2 GB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>Irreversible platform actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Clear Cache</p>
                      <p className="text-sm text-gray-500">Clear Redis cache (may cause temporary slowdown)</p>
                    </div>
                    <Button variant="outline">Clear Cache</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Export All Data</p>
                      <p className="text-sm text-gray-500">Generate a complete data export</p>
                    </div>
                    <Button variant="outline">Export</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-600">Reset Platform</p>
                      <p className="text-sm text-gray-500">Delete all data and reset to initial state</p>
                    </div>
                    <Button variant="destructive">Reset Platform</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
