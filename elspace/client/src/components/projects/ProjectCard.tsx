'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { formatCurrency, formatNumber, getTimeAgo } from '@/lib/utils'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string
    budgetType: string
    budgetMin?: number
    budgetMax?: number
    fixedPrice?: number
    currency: string
    duration: string
    status: string
    skills: string[]
    proposalCount: number
    createdAt: string
    client: {
      id: string
      firstName: string
      lastName: string
      avatar: string
      companyName?: string
      verifiedClient: boolean
    }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { data: session } = useSession()
  const isFreelancer = session?.user?.role === 'FREELANCER'

  const getBudget = () => {
    if (project.budgetType === 'FIXED') {
      return formatCurrency(project.fixedPrice || 0, project.currency)
    }
    return `${formatCurrency(project.budgetMin || 0, project.currency)} - ${formatCurrency(project.budgetMax || 0, project.currency)}`
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/projects/${project.id}`} className="hover:underline">
            <h3 className="font-space-grotesk text-lg font-bold line-clamp-1">
              {project.title}
            </h3>
          </Link>
          <Badge variant={
            project.status === 'OPEN' ? 'success' :
            project.status === 'IN_PROGRESS' ? 'warning' : 'secondary'
          }>
            {project.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {project.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {project.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{project.skills.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-gray-500">Budget</p>
            <p className="font-medium">{getBudget()}</p>
          </div>
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="font-medium">{project.duration}</p>
          </div>
          <div>
            <p className="text-gray-500">Proposals</p>
            <p className="font-medium">{formatNumber(project.proposalCount)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={project.client.avatar} />
            <AvatarFallback>{project.client.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {project.client.firstName} {project.client.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {project.client.companyName || 'Individual'}
              {project.client.verifiedClient && (
                <Icons.checkCircle className="ml-1 inline h-3 w-3 text-cyan-500" />
              )}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {getTimeAgo(project.createdAt)}
        </div>
      </CardFooter>
    </Card>
  )
}
