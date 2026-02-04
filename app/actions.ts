'use server'

import { signIn, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

export async function signOutAction() {
  await signOut({ redirectTo: '/' })
}

export async function signInWithCredentials(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (error) {
    // Handle NextAuth errors and redirect appropriately
    if (error instanceof Error) {
      console.error('Sign in error:', error.message)
    }
    throw error
  }
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
  const existing = await (prisma.user as any).findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  })

  if (!existing) {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create new user with provided details using unchecked create for passwordHash
    await (prisma.user as any).create({
      data: {
        name,
        email,
        country: country || null,
        passwordHash,
      },
    })
  } else {
    // Update existing user's password if they don't have one
    if (!existing.passwordHash) {
      const passwordHash = await bcrypt.hash(password, 10)
      await (prisma.user as any).update({
        where: { id: existing.id },
        data: { passwordHash }
      })
    }
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
  const user = await (prisma.user as any).findUnique({
    where: { email: session.user.email },
    select: { id: true, passwordHash: true },
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
  await (prisma.user as any).update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  })

  // Redirect to dashboard
  redirect('/dashboard?password-changed=true')
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  // Check if user exists
  const user = await (prisma.user as any).findUnique({
    where: { email },
    select: { passwordHash: true },
  })

  // Always redirect to avoid email enumeration
  // Even if user doesn't exist, redirect to the same page
  if (!user) {
    redirect('/forgot-password?link-sent=true')
  }

  // For OAuth-only users without a password, they can't reset
  if (!user.passwordHash) {
    redirect('/forgot-password?oauth=true')
  }

  // Generate reset token
  const resetToken = createHash('sha256')
    .update(randomBytes(32).toString('base64'))
    .digest('base64')
    .replace(/[/+=]/g, '')
    .substring(0, 48)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Store reset token in VerificationToken table
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: resetToken,
      expires: expiresAt,
    },
  })

  // For demo purposes, redirect with the token in URL
  // In production, you would send an email with the reset link
  redirect(`/forgot-password?link-sent=true&token=${resetToken}`)
}

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    throw new Error('Passwords do not match')
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }

  // Find the verification token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    throw new Error('Invalid or expired reset link')
  }

  // Check if token is expired
  if (verificationToken.expires < new Date()) {
    // Delete expired token
    await prisma.verificationToken.delete({
      where: { token },
    })
    throw new Error('Reset link has expired')
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10)

  // Update user password
  await (prisma.user as any).update({
    where: { id: user.id },
    data: { passwordHash },
  })

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { token },
  })

  // Redirect to login with success message
  redirect('/login?reset-success=true')
}

export async function updateMatchResult(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const matchId = formData.get('matchId') as string
  const homeScore = formData.get('homeScore') as string
  const awayScore = formData.get('awayScore') as string
  const status = formData.get('status') as string

  if (!matchId) {
    throw new Error('Match ID is required')
  }

  const data: any = {}
  if (homeScore !== '') data.homeScore = parseInt(homeScore)
  else data.homeScore = null
  if (awayScore !== '') data.awayScore = parseInt(awayScore)
  else data.awayScore = null
  if (status) data.status = status

  await prisma.match.update({
    where: { id: matchId },
    data,
  })

  // Auto-recalculate rankings when match is completed or scores are updated
  if (status === 'COMPLETED' || homeScore !== '' || awayScore !== '') {
    const { recalculateRankings } = await import('@/lib/scoring')
    await recalculateRankings('default')
  }

  // Revalidate pages to show updated data
  revalidatePath('/admin')
  revalidatePath('/standings')
  revalidatePath('/dashboard')
  revalidatePath('/matches')
}

export async function updateRules(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const pointsExact = formData.get('pointsExact') as string
  const pointsWinner = formData.get('pointsWinner') as string
  const pointsOneTeam = formData.get('pointsOneTeam') as string
  const playoffBonus = formData.get('playoffBonus') as string
  const ruleId = formData.get('ruleId') as string

  if (!title || !description) {
    throw new Error('Title and description are required')
  }

  const data: any = {
    title,
    description,
    pointsExact: pointsExact ? parseInt(pointsExact) : 4,
    pointsWinner: pointsWinner ? parseInt(pointsWinner) : 1,
    pointsOneTeam: pointsOneTeam ? parseInt(pointsOneTeam) : 2,
    playoffBonus: playoffBonus ? parseInt(playoffBonus) : 1,
  }

  if (ruleId) {
    // Update existing rule
    await prisma.rule.update({
      where: { id: ruleId },
      data,
    })
  } else {
    // Create new rule
    await prisma.rule.create({
      data: {
        ...data,
        tournamentId: 'default',
      },
    })
  }

  revalidatePath('/admin')
  revalidatePath('/rules')
}
