'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
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
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'

const kycSchema = z.object({
  legalFirstName: z.string().min(1, 'Legal first name is required'),
  legalLastName: z.string().min(1, 'Legal last name is required'),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) 
      ? age - 1 
      : age
    return adjustedAge >= 18
  }, 'You must be at least 18 years old'),
  documentType: z.enum(['DRIVERS_LICENSE', 'NATIONAL_ID', 'VOTERS_CARD', 'RESIDENT_PERMIT', 'PASSPORT']),
  documentNumber: z.string().min(3, 'Document number is required'),
  country: z.string().min(1, 'Country is required'),
  residentPermitNumber: z.string().optional(),
})

type KYCForm = z.infer<typeof kycSchema>

export default function VerificationPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [documentFront, setDocumentFront] = useState<File | null>(null)
  const [documentBack, setDocumentBack] = useState<File | null>(null)
  const [documentSelfie, setDocumentSelfie] = useState<File | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [showCameraDialog, setShowCameraDialog] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const videoElementRef = useRef<HTMLVideoElement>(null)

  const { data: kycStatus, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: async () => {
      const res = await fetch('/api/user/kyc/status')
      if (!res.ok) throw new Error('Failed to fetch KYC status')
      return res.json()
    },
  })

  const form = useForm<KYCForm>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      legalFirstName: session?.user?.legalFirstName || session?.user?.firstName || '',
      legalLastName: session?.user?.legalLastName || session?.user?.lastName || '',
      dateOfBirth: '',
      documentType: 'NATIONAL_ID',
      documentNumber: '',
      country: session?.user?.country || '',
      residentPermitNumber: '',
    },
  })

  const submitKYCMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'KYC submission failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] })
      update()
      toast({
        title: 'KYC Submitted',
        description: 'Your verification documents have been submitted for review.',
      })
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: true 
      })
      setStream(mediaStream)
      setShowCameraDialog(true)
      
      // Set video source
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = mediaStream
      }
    } catch (error) {
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access for video verification.',
        variant: 'destructive',
      })
    }
  }

  const startRecording = () => {
    if (!stream) return

    const recorder = new MediaRecorder(stream)
    const chunks: BlobPart[] = []

    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      setVideoBlob(blob)
      setRecordedVideoUrl(URL.createObjectURL(blob))
      setShowCameraDialog(false)
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    recorder.start()
    setMediaRecorder(recorder)
    setIsRecording(true)

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop()
        setIsRecording(false)
      }
    }, 30000)
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = () => {
    const data = form.getValues()
    
    // Validate age
    const dob = new Date(data.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) 
      ? age - 1 
      : age
    
    if (adjustedAge < 18) {
      toast({
        title: 'Age Verification Failed',
        description: 'You must be at least 18 years old to use this platform.',
        variant: 'destructive',
      })
      return
    }

    if (!documentFront) {
      toast({
        title: 'Missing Document',
        description: 'Please upload the front of your ID document.',
        variant: 'destructive',
      })
      return
    }

    if (!videoBlob) {
      toast({
        title: 'Missing Video',
        description: 'Please record a video verification.',
        variant: 'destructive',
      })
      return
    }

    const formData = new FormData()
    formData.append('legalFirstName', data.legalFirstName)
    formData.append('legalLastName', data.legalLastName)
    formData.append('dateOfBirth', data.dateOfBirth)
    formData.append('documentType', data.documentType)
    formData.append('documentNumber', data.documentNumber)
    formData.append('country', data.country)
    if (data.residentPermitNumber) {
      formData.append('residentPermitNumber', data.residentPermitNumber)
    }
    formData.append('documentFront', documentFront)
    if (documentBack) {
      formData.append('documentBack', documentBack)
    }
    if (documentSelfie) {
      formData.append('documentSelfie', documentSelfie)
    }
    formData.append('videoVerification', videoBlob, 'verification.webm')

    submitKYCMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  // Show KYC status if already submitted
  if (kycStatus?.status === 'APPROVED') {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Icons.checkCircle className="h-8 w-8 text-green-500" />
              <div>
                <CardTitle>Identity Verified</CardTitle>
                <CardDescription>
                  Your identity has been successfully verified
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Verified on:</strong> {formatDate(kycStatus.verifiedAt)}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Document Type:</strong> {kycStatus.documentType}
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (kycStatus?.status === 'PENDING' || kycStatus?.status === 'UNDER_REVIEW') {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Icons.clock className="h-8 w-8 text-amber-500" />
              <div>
                <CardTitle>Verification In Progress</CardTitle>
                <CardDescription>
                  Your identity verification is currently under review
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Submitted on:</strong> {formatDate(kycStatus.submittedAt)}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Status:</strong> {kycStatus.status}
                </p>
              </div>
              <Progress value={60} className="w-full" />
              <p className="text-sm text-gray-500">
                We'll notify you via email once your verification is complete (usually 24-48 hours).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (kycStatus?.status === 'REJECTED') {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Icons.xCircle className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle>Verification Rejected</CardTitle>
                <CardDescription>
                  Your identity verification was not approved
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Reason:</strong> {kycStatus.rejectionReason}
                </p>
              </div>
              <Button onClick={() => {
                setStep(1)
                form.reset()
              }}>
                Resubmit Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // KYC Form
  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold">Identity Verification</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Complete KYC to unlock full platform features
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-medium ${
                step >= s ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Icons.check className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`h-1 w-12 mx-1 ${
                  step > s ? 'bg-cyan-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Enter your legal information as it appears on your ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalFirstName">Legal First Name</Label>
                  <Input
                    id="legalFirstName"
                    placeholder="As on ID"
                    {...form.register('legalFirstName')}
                  />
                  {form.formState.errors.legalFirstName && (
                    <p className="text-sm text-red-500">{form.formState.errors.legalFirstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalLastName">Legal Last Name</Label>
                  <Input
                    id="legalLastName"
                    placeholder="As on ID"
                    {...form.register('legalLastName')}
                  />
                  {form.formState.errors.legalLastName && (
                    <p className="text-sm text-red-500">{form.formState.errors.legalLastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  {...form.register('dateOfBirth')}
                />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-sm text-red-500">{form.formState.errors.dateOfBirth.message}</p>
                )}
                <p className="text-xs text-gray-500">You must be at least 18 years old</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country of Residence</Label>
                <Select
                  value={form.watch('country')}
                  onValueChange={(value) => form.setValue('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="NG">Nigeria</SelectItem>
                    <SelectItem value="ZA">South Africa</SelectItem>
                    <SelectItem value="KE">Kenya</SelectItem>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.country && (
                  <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Document Information */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>ID Document</CardTitle>
            <CardDescription>
              Select and enter your identification document details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={form.watch('documentType')}
                  onValueChange={(value: any) => form.setValue('documentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                    <SelectItem value="NATIONAL_ID">National ID Card</SelectItem>
                    <SelectItem value="VOTERS_CARD">Voter's Card</SelectItem>
                    <SelectItem value="RESIDENT_PERMIT">Resident Permit</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Document Number</Label>
                <Input
                  id="documentNumber"
                  placeholder="Enter document number"
                  {...form.register('documentNumber')}
                />
                {form.formState.errors.documentNumber && (
                  <p className="text-sm text-red-500">{form.formState.errors.documentNumber.message}</p>
                )}
              </div>

              {form.watch('documentType') === 'RESIDENT_PERMIT' && (
                <div className="space-y-2">
                  <Label htmlFor="residentPermitNumber">Resident Permit Number</Label>
                  <Input
                    id="residentPermitNumber"
                    placeholder="Enter permit number"
                    {...form.register('residentPermitNumber')}
                  />
                </div>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Document Upload */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload clear photos of your identification document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>Front of Document *</Label>
                <div className="mt-2">
                  {documentFront ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(documentFront)}
                        alt="Document front"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => setDocumentFront(null)}
                      >
                        <Icons.x className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-cyan-500">
                      <Icons.upload className="h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to upload front of ID</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setDocumentFront(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>Back of Document (Optional)</Label>
                <div className="mt-2">
                  {documentBack ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(documentBack)}
                        alt="Document back"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => setDocumentBack(null)}
                      >
                        <Icons.x className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-cyan-500">
                      <Icons.upload className="h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to upload back of ID</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setDocumentBack(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>Selfie with ID (Optional)</Label>
                <div className="mt-2">
                  {documentSelfie ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(documentSelfie)}
                        alt="Selfie with ID"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => setDocumentSelfie(null)}
                      >
                        <Icons.x className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-cyan-500">
                      <Icons.camera className="h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to take a selfie with your ID</p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => setDocumentSelfie(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(4)}>
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Video Verification */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Video Verification</CardTitle>
            <CardDescription>
              Record a short video to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Icons.info className="h-4 w-4" />
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                  Please record a 10-30 second video where you:
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    <li>State your full name clearly</li>
                    <li>Hold your ID document next to your face</li>
                    <li>Say "I confirm my identity for EL SPACE verification"</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {recordedVideoUrl ? (
                <div className="space-y-3">
                  <video
                    src={recordedVideoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setRecordedVideoUrl(null)
                      setVideoBlob(null)
                    }}
                  >
                    Record Again
                  </Button>
                </div>
              ) : (
                <Button onClick={startCamera} className="w-full">
                  <Icons.video className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!recordedVideoUrl || submitKYCMutation.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {submitKYCMutation.isPending && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Verification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Verification Video</DialogTitle>
            <DialogDescription>
              {isRecording ? 'Recording... Speak clearly' : 'Ready to record'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <video
              ref={videoElementRef}
              autoPlay
              muted
              className="w-full rounded-lg"
            />
            <div className="flex justify-center gap-2">
              {!isRecording ? (
                <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                  <Icons.circle className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="outline">
                  <Icons.square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              )}
            </div>
            {isRecording && (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm text-red-500">Recording...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
