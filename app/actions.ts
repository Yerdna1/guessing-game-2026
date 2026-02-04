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
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect('/login?error=OAuthNotConfigured')
  }
  await signIn('google', { redirectTo: '/dashboard' })
}

export async function signInWithGitHub() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    redirect('/login?error=OAuthNotConfigured')
  }
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
  revalidatePath('/excel')
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

export async function syncFromExcelUpload(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  // Verify admin permissions
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized - Admin access required' }
  }

  try {
    // Get file from form data
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return { success: false, error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' }
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum size is 10MB' }
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()

    // Import syncExcelData function
    const { syncExcelData } = await import('@/lib/sync-excel')

    // Sync data
    const result = await syncExcelData(buffer)

    // Recalculate rankings after sync
    if (result.success) {
      const { recalculateRankings } = await import('@/lib/scoring')
      await recalculateRankings('default')
    }

    // Revalidate all affected pages
    revalidatePath('/excel')
    revalidatePath('/dashboard')
    revalidatePath('/matches')
    revalidatePath('/admin')
    revalidatePath('/standings')

    return { success: true, data: result }

  } catch (error) {
    console.error('Excel sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while processing the Excel file'
    }
  }
}

export async function createMatch(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const homeTeamId = formData.get('homeTeamId') as string
  const awayTeamId = formData.get('awayTeamId') as string
  const scheduledDate = formData.get('scheduledDate') as string
  const scheduledTime = formData.get('scheduledTime') as string
  const venue = formData.get('venue') as string
  const stage = formData.get('stage') as string
  const isPlayoff = formData.get('isPlayoff') === 'true'

  if (!homeTeamId || !awayTeamId || !scheduledDate || !scheduledTime) {
    throw new Error('Missing required fields')
  }

  // Combine date and time
  const scheduledTimeDate = new Date(`${scheduledDate}T${scheduledTime}`)

  // Get the next match number
  const maxMatchNumber = await prisma.match.findFirst({
    where: { tournamentId: 'default' },
    orderBy: { matchNumber: 'desc' },
    select: { matchNumber: true }
  })

  const matchNumber = (maxMatchNumber?.matchNumber ?? 0) + 1

  // Create match
  await prisma.match.create({
    data: {
      tournamentId: 'default',
      homeTeamId,
      awayTeamId,
      scheduledTime: scheduledTimeDate,
      venue: venue || null,
      stage: (stage as any) || 'GROUP_STAGE',
      isPlayoff,
      status: 'SCHEDULED',
      matchNumber
    }
  })

  revalidatePath('/admin')
  revalidatePath('/matches')
  revalidatePath('/excel')
  revalidatePath('/dashboard')
}

export async function deleteMatch(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const matchId = formData.get('matchId') as string

  if (!matchId) {
    throw new Error('Match ID is required')
  }

  // Delete all guesses for this match first
  await prisma.guess.deleteMany({
    where: { matchId }
  })

  // Delete the match
  await prisma.match.delete({
    where: { id: matchId }
  })

  revalidatePath('/admin')
  revalidatePath('/matches')
  revalidatePath('/excel')
  revalidatePath('/dashboard')
}

export async function createUser(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const country = formData.get('country') as string
  const role = formData.get('role') as string

  if (!name || !email) {
    throw new Error('Name and email are required')
  }

  // Check if user already exists
  const existing = await (prisma.user as any).findUnique({
    where: { email },
  })

  if (existing) {
    throw new Error('User with this email already exists')
  }

  // Hash password if provided
  let passwordHash: string | null = null
  if (password && password.trim() !== '') {
    passwordHash = await bcrypt.hash(password, 10)
  }

  // Create new user
  await (prisma.user as any).create({
    data: {
      name,
      email,
      country: country || null,
      role: (role as any) || 'USER',
      passwordHash,
    },
  })

  revalidatePath('/admin')
  revalidatePath('/excel')
  revalidatePath('/dashboard')
}

export async function updateUser(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const userId = formData.get('userId') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const country = formData.get('country') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  if (!userId) {
    throw new Error('User ID is required')
  }

  if (!name || !email) {
    throw new Error('Name and email are required')
  }

  // Check if email is taken by another user
  const existing = await (prisma.user as any).findUnique({
    where: { email },
  })

  if (existing && existing.id !== userId) {
    throw new Error('Email is already in use by another user')
  }

  // Prepare update data
  const data: any = {
    name,
    email,
    country: country || null,
    role: (role as any) || 'USER',
  }

  // Update password if provided
  if (password && password.trim() !== '') {
    data.passwordHash = await bcrypt.hash(password, 10)
  }

  // Update user
  await (prisma.user as any).update({
    where: { id: userId },
    data,
  })

  revalidatePath('/admin')
  revalidatePath('/excel')
  revalidatePath('/dashboard')
}

export async function deleteUser(formData: FormData) {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const userId = formData.get('userId') as string

  if (!userId) {
    throw new Error('User ID is required')
  }

  // Prevent deleting yourself
  if (session.user.id === userId) {
    throw new Error('Cannot delete your own account')
  }

  // Delete all guesses for this user first
  await prisma.guess.deleteMany({
    where: { userId }
  })

  // Delete the user
  await prisma.user.delete({
    where: { id: userId }
  })

  revalidatePath('/admin')
  revalidatePath('/excel')
  revalidatePath('/dashboard')
}
