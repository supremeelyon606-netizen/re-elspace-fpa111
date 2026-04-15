'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/useToast'

async function fetchDisputes() {
  const res = await fetch('/api/disputes')
  if (!res.ok) throw new Error('Failed to fetch disputes')
  return res.json()
}

export default function DisputesPage() {
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: fetchDisputes,
  })

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold">Dispute Resolution</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage disputes and get support</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Disputes</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="support">Support Ticket</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : data?.activeDisputes?.length > 0 ? (
            <div className="space-y-4">
              {data.activeDisputes.map((dispute: any) => (
                <Card key={dispute.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{dispute.title}</CardTitle>
                        <CardDescription>{dispute.description}</CardDescription>
                      </div>
                      <Badge>{dispute.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-medium">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-medium">${dispute.amount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Icons.shield className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No active disputes</h3>
                <p className="text-gray-500">You don't have any active disputes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="mt-6">
          {data?.resolvedDisputes?.length > 0 ? (
            <div className="space-y-4">
              {data.resolvedDisputes.map((dispute: any) => (
                <Card key={dispute.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{dispute.title}</CardTitle>
                      <Badge variant="secondary">Resolved</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No resolved disputes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <CardDescription>Need help? Submit a support request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Describe your issue" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Provide details" rows={6} />
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Submit Ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
