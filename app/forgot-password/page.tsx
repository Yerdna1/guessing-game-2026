import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { forgotPassword } from '@/app/actions'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { 'link-sent'?: string; token?: string; oauth?: string }
}) {
  const linkSent = searchParams['link-sent']
  const resetToken = searchParams.token
  const isOAuth = searchParams.oauth

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-muted-foreground">Reset your account password</p>
          </div>

          {linkSent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {isOAuth ? (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  <CardTitle>
                    {isOAuth ? 'OAuth Account Detected' : 'Reset Link Sent'}
                  </CardTitle>
                </div>
                <CardDescription>
                  {isOAuth
                    ? 'This account uses Google or GitHub for sign in. You cannot reset a password for an OAuth account.'
                    : 'If an account exists with this email, a password reset link has been generated below.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resetToken && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Demo Reset Link:</p>
                    <Link
                      href={`/reset-password?token=${resetToken}`}
                      className="text-sm text-primary break-all hover:underline"
                    >
                      {`${window.location.origin}/reset-password?token=${resetToken}`}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      In production, this would be sent via email. Click the link above to reset your password.
                    </p>
                  </div>
                )}
                <Button asChild className="w-full">
                  <Link href="/login">Back to Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={forgotPassword} className="space-y-4">
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
                  <Button type="submit" className="w-full">
                    Send Reset Link
                  </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
