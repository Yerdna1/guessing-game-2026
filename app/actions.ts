'use server'

import { signIn, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import * as bcrypt from 'bcryptjs'

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
  const password = formData.get('password') as string
  const country = formData.get('country') as string

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (!existing) {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create new user with provided details
    await prisma.user.create({
      data: {
        name,
        email,
        country: country || null,
        passwordHash,
      },
    })
  }

  // Sign in with email and password
  await signIn('credentials', { email, password, redirectTo: '/dashboard' })
}

export async function recalculateRankingsAction(): Promise<void> {
  const { recalculateRankings } = await import('@/lib/scoring')
  await recalculateRankings('default')
}

export async function changePassword(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validate new password
  if (newPassword !== confirmPassword) {
    throw new Error('New passwords do not match')
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Verify current password if user has a password hash
  if (user.passwordHash) {
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      throw new Error('Current password is incorrect')
    }
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  // Update user password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  })

  // Redirect to dashboard
  redirect('/dashboard?password-changed=true')
}
