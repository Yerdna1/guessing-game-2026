'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { registerUser, verifyEmail, resendVerificationEmail } from '@/app/actions'
import { OAuthButtons } from '@/components/OAuthButtons'
import { useToast } from '@/hooks/use-toast'

function RegisterContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const verificationSent = searchParams.get('verification-sent') === 'true'
  const token = searchParams.get('token')
  const error = searchParams.get('error')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendEmail, setResendEmail] = useState('')

  // Check OAuth configuration
  const googleEnabled = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET
  const githubEnabled = !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET

  const handleVerify = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await verifyEmail(formData)
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('email', resendEmail)
      await resendVerificationEmail(formData)
    } catch (error) {
      toast({
        title: 'Resend failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show verification screen
  if (verificationSent && token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="text-muted-foreground text-center">
              We've sent a verification link to your email
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Check Your Inbox</CardTitle>
              <CardDescription>
                Click the button below to verify your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Demo: Show verification token */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Demo Mode:</strong> In production, this would be sent via email.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 break-all font-mono">
                  Token: {token}
                </p>
              </div>

              <form action={handleVerify}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Email Address
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the email?
                </p>
                <form onSubmit={handleResend} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
                    Resend
                  </Button>
                </form>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error screen
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold">Registration Error</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {decodeURIComponent(error)}
              </p>
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href="/register">Try Again</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join the guessing game</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create an account to start predicting match scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={registerUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Name Surname"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country (Optional)</Label>
                <Input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="Slovakia"
                />
              </div>
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>

            <OAuthButtons googleEnabled={googleEnabled} githubEnabled={githubEnabled} />

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
