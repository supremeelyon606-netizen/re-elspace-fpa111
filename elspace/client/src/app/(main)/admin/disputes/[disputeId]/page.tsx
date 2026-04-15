'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatCurrency } from '@/lib/utils'

async function fetchDispute(id: string) {
  const res = await fetch(`/api/admin/disputes/${id}`)
  if (!res.ok) throw new Error('Failed to fetch dispute')
  return res.json()
}

export default function AdminDisputeDetailPage({ params }: { params: { disputeId: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [resolution, setResolution] = useState('')
  const [decision, setDecision] = useState('')
  const [showResolutionDialog, setShowResolutionDialog] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dispute', params.disputeId],
    queryFn: () => fetchDispute(params.disputeId),
  })

  const resolveDisputeMutation = useMutation({
    mutationFn: async (data: { resolution: string; decision: string }) => {
      const res = await fetch(`/api/admin/disputes/${params.disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to resolve dispute')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dispute', params.disputeId] })
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] })
      toast({
        title: 'Dispute Resolved',
        description: 'The dispute has been successfully resolved.',
      })
      setShowResolutionDialog(false)
      router.push('/admin')
    },
  })

  const escalateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/disputes/${params.disputeId}/escalate`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to escalate dispute')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dispute', params.disputeId] })
      toast({
        title: 'Dispute Escalated',
        description: 'The dispute has been escalated for further review.',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  const dispute = data?.dispute

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <Icons.arrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-space-grotesk text-2xl font-bold">
              Dispute #{dispute?.disputeId}
            </h1>
            <p className="text-gray-500">
              {dispute?.project?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={
            dispute?.status === 'OPEN' ? 'warning' :
            dispute?.status === 'UNDER_REVIEW' ? 'secondary' :
            dispute?.status === 'RESOLVED' ? 'success' : 'destructive'
          }>
            {dispute?.status}
          </Badge>
          {dispute?.status !== 'RESOLVED' && (
            <>
              <Button variant="outline" onClick={() => escalateMutation.mutate()}>
                Escalate
              </Button>
              <Button onClick={() => setShowResolutionDialog(true)}>
                Resolve Dispute
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <Badge variant="outline">{dispute?.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <Badge variant={
                    dispute?.priority === 'URGENT' ? 'destructive' : 
                    dispute?.priority === 'HIGH' ? 'warning' : 'secondary'
                  }>
                    {dispute?.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p>{formatDate(dispute?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p>{formatDate(dispute?.updatedAt)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium">Reason</p>
                <p className="text-gray-600 dark:text-gray-300">{dispute?.reason}</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Description</p>
                <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                  {dispute?.description}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Desired Outcome</p>
                <p className="text-gray-600 dark:text-gray-300">{dispute?.desiredOutcome}</p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {dispute?.evidence?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {dispute.evidence.map((item: any) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant="outline">{item.type}</Badge>
                        <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                      </div>
                      <p className="mb-2 text-sm">{item.description}</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Icons.download className="mr-2 h-4 w-4" />
                          View Evidence
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No evidence submitted</p>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 space-y-4 overflow-y-auto">
                {dispute?.messages?.map((message: any) => (
                  <div key={message.id} className={`flex ${message.isInternal ? 'bg-amber-50 dark:bg-amber-950' : ''} rounded-lg p-3`}>
                    <Avatar className="mr-3 h-8 w-8">
                      <AvatarImage src={message.sender?.avatar} />
                      <AvatarFallback>{message.sender?.firstName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {message.sender?.firstName} {message.sender?.lastName}
                          {message.isInternal && (
                            <Badge variant="outline" className="ml-2">Internal</Badge>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(message.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add internal note */}
              <div className="mt-4">
                <Textarea placeholder="Add an internal note (only visible to admins)..." rows={2} />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="outline">
                    Add Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Project</p>
                <Link href={`/projects/${dispute?.project?.id}`} className="font-medium hover:text-cyan-500">
                  {dispute?.project?.title}
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium">{formatCurrency(dispute?.project?.budget)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge>{dispute?.project?.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">Initiator</p>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={dispute?.initiator?.avatar} />
                    <AvatarFallback>{dispute?.initiator?.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/profile/${dispute?.initiator?.id}`} className="font-medium hover:text-cyan-500">
                      {dispute?.initiator?.firstName} {dispute?.initiator?.lastName}
                    </Link>
                    <p className="text-sm text-gray-500">{dispute?.initiator?.email}</p>
                    <Badge variant="outline" className="mt-1">{dispute?.initiator?.role}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">Respondent</p>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={dispute?.respondent?.avatar} />
                    <AvatarFallback>{dispute?.respondent?.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/profile/${dispute?.respondent?.id}`} className="font-medium hover:text-cyan-500">
                      {dispute?.respondent?.firstName} {dispute?.respondent?.lastName}
                    </Link>
                    <p className="text-sm text-gray-500">{dispute?.respondent?.email}</p>
                    <Badge variant="outline" className="mt-1">{dispute?.respondent?.role}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escrow Status */}
          <Card>
            <CardHeader>
              <CardTitle>Escrow Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount in Escrow</span>
                  <span className="font-medium">{formatCurrency(dispute?.escrowAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Milestone</span>
                  <span>{dispute?.milestone?.title || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Make a final decision on this dispute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Decision</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REFUND_CLIENT">Refund Client (Full Amount)</SelectItem>
                  <SelectItem value="RELEASE_FREELANCER">Release to Freelancer (Full Amount)</SelectItem>
                  <SelectItem value="PARTIAL_REFUND">Partial Refund</SelectItem>
                  <SelectItem value="SPLIT">Split Payment</SelectItem>
                  <SelectItem value="DISMISS">Dismiss Dispute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Explain your decision..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowResolutionDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => resolveDisputeMutation.mutate({ resolution, decision })}
                disabled={!decision || !resolution || resolveDisputeMutation.isPending}
              >
                {resolveDisputeMutation.isPending && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Resolution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
