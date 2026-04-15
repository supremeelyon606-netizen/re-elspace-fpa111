'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/components/ui/use-toast'

const supportSchema = z.object({
  category: z.enum(['ACCOUNT', 'PAYMENT', 'PROJECT', 'TECHNICAL', 'DISPUTE', 'OTHER']),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(20, 'Please provide more details (minimum 20 characters)'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

type SupportForm = z.infer<typeof supportSchema>

export function SupportTicketForm() {
  const { toast } = useToast()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<SupportForm>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      category: 'PROJECT',
      subject: '',
      description: '',
      priority: 'MEDIUM',
    },
  })

  const submitTicketMutation = useMutation({
    mutationFn: async (data: SupportForm) => {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to submit ticket')
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Ticket Submitted',
        description: `Your support ticket #${data.ticketId} has been created. We'll respond within 24 hours.`,
      })
      setIsSubmitted(true)
      form.reset()
    },
    onError: () => {
      toast({
        title: 'Submission Failed',
        description: 'Unable to submit your ticket. Please try again.',
      })
    },
  })

  const onSubmit = (data: SupportForm) => {
    submitTicketMutation.mutate(data)
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icons.checkCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium">Ticket Submitted</h3>
          <p className="text-gray-500">
            We've received your request and will respond within 24 hours.
          </p>
          <Button className="mt-4" onClick={() => setIsSubmitted(false)}>
            Submit Another Ticket
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>
          Submit a support ticket and we'll get back to you as soon as possible
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(value: any) => form.setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCOUNT">Account Issues</SelectItem>
                <SelectItem value="PAYMENT">Payment & Billing</SelectItem>
                <SelectItem value="PROJECT">Project Issues</SelectItem>
                <SelectItem value="TECHNICAL">Technical Support</SelectItem>
                <SelectItem value="DISPUTE">Dispute Assistance</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={form.watch('priority')}
              onValueChange={(value: any) => form.setValue('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low - General question</SelectItem>
                <SelectItem value="MEDIUM">Medium - Need assistance</SelectItem>
                <SelectItem value="HIGH">High - Blocking work</SelectItem>
                <SelectItem value="URGENT">Urgent - Payment/Escrow issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              {...form.register('subject')}
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please provide as much detail as possible..."
              rows={6}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-700">
              <div className="text-center">
                <Icons.upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" size="sm" className="mt-2" type="button">
                  Select Files
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitTicketMutation.isPending}>
              {submitTicketMutation.isPending && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Ticket
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
