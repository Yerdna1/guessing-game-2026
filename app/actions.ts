'use server'

import { signIn, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function signOutAction() {
  await signOut()
}

export async function signInWithCredentials(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // For demo purposes, any email/password works
  // In production, you'd validate credentials
  await signIn('credentials', { email, redirectTo: '/dashboard' })
}

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}

export async function signInWithGitHub() {
  await signIn('github', { redirectTo: '/dashboard' })
}

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const country = formData.get('country') as string

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (!existing) {
    // Create new user with provided details
    await prisma.user.create({
      data: {
        name,
        email,
        country: country || null,
      },
    })
  }

  // Sign in (user will be created automatically by credentials provider if needed)
  await signIn('credentials', { email, redirectTo: '/dashboard' })
}

export async function recalculateRankingsAction(): Promise<void> {
  const { recalculateRankings } = await import('@/lib/scoring')
  await recalculateRankings('default')
}
