'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/useToast'
import { Icons } from '@/components/ui/icons'

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
  role: z.enum(['CLIENT', 'FREELANCER']),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'FREELANCER',
      acceptTerms: false,
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      toast({
        title: 'Account Created',
        description: 'Please check your email to verify your account.',
        variant: 'success',
      })

      await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignup = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (error) {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-8">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center space-x-2 md:left-8 md:top-8"
      >
        <Icons.logo className="h-8 w-8" />
        <span className="font-space-grotesk text-xl font-bold">
          <span className="text-cyan-500">EL</span>
          <span className="text-indigo-900 dark:text-white">SPACE</span>
        </span>
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="font-space-grotesk text-3xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join EL SPACE and start your journey
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              {/* Role Selection */}
              <div className="grid gap-2">
                <Label>I want to...</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setValue('role', value as 'CLIENT' | 'FREELANCER')}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="freelancer"
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                      selectedRole === 'FREELANCER'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                        : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <RadioGroupItem value="FREELANCER" id="freelancer" className="sr-only" />
                    <Icons.briefcase className="mb-2 h-6 w-6" />
                    <span className="font-medium">Find Work</span>
                    <span className="text-xs text-gray-500">as a Freelancer</span>
                  </Label>
                  <Label
                    htmlFor="client"
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                      selectedRole === 'CLIENT'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                        : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <RadioGroupItem value="CLIENT" id="client" className="sr-only" />
                    <Icons.building className="mb-2 h-6 w-6" />
                    <span className="font-medium">Hire Talent</span>
                    <span className="text-xs text-gray-500">as a Client</span>
                  </Label>
                </RadioGroup>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    disabled={isLoading}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    disabled={isLoading}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  className="mt-1"
                  {...register('acceptTerms')}
                />
                <Label
                  htmlFor="acceptTerms"
                  className="text-sm font-normal text-gray-500 dark:text-gray-400"
                >
                  I agree to the{' '}
                  <Link href="/legal/terms" className="text-cyan-500 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/legal/privacy" className="text-cyan-500 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
              )}

              <Button type="submit" disabled={isLoading} className="bg-amber-500 hover:bg-amber-600">
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-950">
                Or sign up with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialSignup('google')}
            >
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialSignup('github')}
            >
              <Icons.gitHub className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-cyan-500 hover:text-cyan-600"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
