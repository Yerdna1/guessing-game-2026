import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const DEFAULT_PASSWORD = '123456'

export async function POST() {
  try {
    // Admin-only
    const session = await auth()
    if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, emailVerified: true }
    })

    let updated = 0
    let verified = 0
    const details: string[] = []

    for (const user of users) {
      const data: { passwordHash: string; emailVerified?: Date } = { passwordHash }

      if (!user.emailVerified) {
        data.emailVerified = new Date()
        verified++
      }

      await prisma.user.update({
        where: { id: user.id },
        data
      })

      updated++
      details.push(`${user.name || '(no name)'} <${user.email}>${!user.emailVerified ? ' [verified]' : ''}`)
    }

    return NextResponse.json({
      success: true,
      message: `Reset ${updated} users to password "${DEFAULT_PASSWORD}". ${verified} emails verified.`,
      updated,
      verified,
      details
    })
  } catch (error) {
    console.error('Error resetting passwords:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset passwords' },
      { status: 500 }
    )
  }
}
