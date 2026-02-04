import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params

    const guess = await prisma.guess.findUnique({
      where: {
        userId_matchId: {
          userId: session.user.id,
          matchId,
        },
      },
    })

    if (!guess) {
      return NextResponse.json(null)
    }

    return NextResponse.json(guess)
  } catch (error) {
    console.error('Error fetching guess:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
