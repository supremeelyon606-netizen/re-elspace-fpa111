'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'
import { formatRating, getInitials } from '@/lib/utils'
import Link from 'next/link'

async function fetchProfile(userId: string) {
  const res = await fetch(`/api/profiles/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

async function fetchReviews(userId: string) {
  const res = await fetch(`/api/profiles/${userId}/reviews`)
  if (!res.ok) throw new Error('Failed to fetch reviews')
  return res.json()
}

interface ProfilePageProps {
  params: { userId?: string }
  searchParams: { tab?: string }
}

export default function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { data: session } = useSession()
  const userId = params?.userId || session?.user?.id
  const { toast } = useToast()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  })

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['profile-reviews', userId],
    queryFn: () => fetchReviews(userId!),
    enabled: !!userId,
  })

  const isOwnProfile = session?.user?.id === userId

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      {/* Header */}
      {profileLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : profile ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-space-grotesk text-3xl font-bold">{profile.name}</h1>
                    <p className="text-gray-500">{profile.title}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Icons.star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{formatRating(profile.rating)}</span>
                        <span className="text-sm text-gray-500">({profile.reviewCount} reviews)</span>
                      </div>
                      {profile.role === 'freelancer' && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {profile.completionRate}% Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {!isOwnProfile && (
                  <div className="space-y-2">
                    <Link href={`/messages?userId=${userId}`}>
                      <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                        <Icons.message className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                    </Link>
                    {profile.role === 'freelancer' && (
                      <Link href={`/sessions/book/${userId}`}>
                        <Button variant="outline" className="w-full">
                          <Icons.calendar className="mr-2 h-4 w-4" />
                          Book Session
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
                {isOwnProfile && (
                  <Link href="/settings/profile">
                    <Button variant="outline">
                      <Icons.edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue={searchParams?.tab || 'about'}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>
                  </div>

                  {profile.role === 'freelancer' && (
                    <>
                      <div>
                        <h3 className="mb-2 font-semibold">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills?.map((skill: string) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 font-semibold">Experience</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{profile.yearsOfExperience} years</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm text-gray-500">Projects Completed</p>
                          <p className="text-2xl font-bold">{profile.projectsCompleted}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Active Projects</p>
                          <p className="text-2xl font-bold">{profile.activeProjects}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Earnings</p>
                          <p className="text-2xl font-bold text-green-600">${profile.totalEarnings}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hourly Rate</p>
                          <p className="text-2xl font-bold">${profile.hourlyRate}/hr</p>
                        </div>
                      </div>
                    </>
                  )}

                  {profile.role === 'client' && (
                    <>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Spent</p>
                          <p className="text-2xl font-bold">${profile.totalSpent}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Projects Posted</p>
                          <p className="text-2xl font-bold">{profile.projectsPosted}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Active Hires</p>
                          <p className="text-2xl font-bold">{profile.activeHires}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Repeat Hires</p>
                          <p className="text-2xl font-bold">{profile.repeatHires}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-6">
              <div className="space-y-4">
                {profile.portfolio?.length > 0 ? (
                  profile.portfolio.map((item: any) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="h-48 w-full rounded-lg object-cover" />
                          )}
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Icons.externalLink className="mr-2 h-4 w-4" />
                                View Project
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Icons.folder className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-gray-500">No portfolio items yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4">
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Icons.spinner className="h-6 w-6 animate-spin text-cyan-500" />
                  </div>
                ) : reviews?.length > 0 ? (
                  reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.reviewerAvatar} />
                              <AvatarFallback>{getInitials(review.reviewerName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.reviewerName}</p>
                              <p className="text-xs text-gray-500">{review.projectTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Icons.star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Icons.star className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-gray-500">No reviews yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="credentials" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verified Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.credentials?.map((cred: any) => (
                      <div key={cred.id} className="flex items-center gap-3">
                        <Icons.checkCircle className="h-5 w-5 text-green-600" />
                        <span>{cred.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}
