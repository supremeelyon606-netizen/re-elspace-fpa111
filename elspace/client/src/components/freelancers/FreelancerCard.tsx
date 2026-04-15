'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface FreelancerCardProps {
  freelancer: {
    id: string
    firstName: string
    lastName: string
    avatar: string
    headline: string
    title: string
    hourlyRate: number
    currency: string
    rating: number
    totalReviews: number
    completedProjects: number
    totalEarned: number
    skills: string[]
    location: string
    availability: string
    verificationLevel: string
    elaccessGraduate: boolean
  }
}

export function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const { data: session } = useSession()
  const isClient = session?.user?.role === 'CLIENT'

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex-1 p-6">
        <div className="flex items-start space-x-4">
          <Link href={`/freelancers/${freelancer.id}`}>
            <Avatar className="h-16 w-16">
              <AvatarImage src={freelancer.avatar} />
              <AvatarFallback className="text-xl">
                {freelancer.firstName?.[0]}{freelancer.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/freelancers/${freelancer.id}`}>
                  <h3 className="font-space-grotesk text-lg font-bold hover:text-cyan-500">
                    {freelancer.firstName} {freelancer.lastName}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500">{freelancer.headline || freelancer.title}</p>
              </div>
              {freelancer.elaccessGraduate && (
                <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                  <Icons.graduationCap className="mr-1 h-3 w-3" />
                  ELACCESS
                </Badge>
              )}
            </div>

            <div className="mt-2 flex items-center space-x-3 text-sm">
              <div className="flex items-center">
                <Icons.star className="mr-1 h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="font-medium">{freelancer.rating.toFixed(1)}</span>
                <span className="ml-1 text-gray-500">({freelancer.totalReviews})</span>
              </div>
              <div className="flex items-center">
                <Icons.briefcase className="mr-1 h-4 w-4 text-gray-400" />
                <span>{freelancer.completedProjects} projects</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          {freelancer.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {freelancer.skills.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{freelancer.skills.length - 4}
            </Badge>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Hourly Rate</p>
            <p className="font-medium">{formatCurrency(freelancer.hourlyRate, freelancer.currency)}/hr</p>
          </div>
          <div>
            <p className="text-gray-500">Total Earned</p>
            <p className="font-medium">{formatCurrency(freelancer.totalEarned, freelancer.currency)}</p>
          </div>
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium">{freelancer.location || 'Remote'}</p>
          </div>
          <div>
            <p className="text-gray-500">Availability</p>
            <Badge variant={
              freelancer.availability === 'IMMEDIATELY' ? 'success' :
              freelancer.availability === 'WITHIN_WEEK' ? 'warning' : 'secondary'
            }>
              {freelancer.availability?.replace(/_/g, ' ') || 'Available'}
            </Badge>
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-2">
          {freelancer.verificationLevel === 'VERIFIED' && (
            <Badge variant="outline" className="text-green-600">
              <Icons.checkCircle className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}
          {freelancer.verificationLevel === 'PREMIUM' && (
            <Badge className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
              <Icons.crown className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t p-4">
        <div className="flex w-full space-x-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/freelancers/${freelancer.id}`}>
              View Profile
            </Link>
          </Button>
          {isClient && (
            <>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600" asChild>
                <Link href={`/sessions/book/${freelancer.id}`}>
                  Book Session
                </Link>
              </Button>
              <Button variant="outline" size="icon">
                <Icons.bookmark className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
