import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { resetPassword } from '@/app/actions'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1 flex items-center justify-center bg-muted/30 px-4">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-destructive/10 rounded-full mb-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">Invalid Link</h1>
              <p className="text-muted-foreground">This password reset link is invalid</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground mb-4">
                  The password reset link is missing or has expired. Please request a new one.
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link href="/forgot-password">Request New Link</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Back to Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">Choose a new password</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={resetPassword} className="space-y-4">
                <input type="hidden" name="token" value={token} />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Reset Password
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
