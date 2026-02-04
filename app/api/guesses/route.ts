import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    const guesses = await prisma.guess.findMany({
      where: {
        userId: session.user.id,
        ...(matchId && { matchId }),
      },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(guesses)
  } catch (error) {
    console.error('Error fetching guesses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { matchId, homeScore, awayScore } = body

    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (homeScore < 0 || awayScore < 0) {
      return NextResponse.json({ error: 'Scores must be non-negative' }, { status: 400 })
    }

    // Check if match is still scheduled (not started or completed)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Match has already started or completed' }, { status: 400 })
    }

    // Upsert the guess
    const guess = await prisma.guess.upsert({
      where: {
        userId_matchId: {
          userId: session.user.id,
          matchId,
        },
      },
      update: {
        homeScore,
        awayScore,
      },
      create: {
        userId: session.user.id,
        matchId,
        homeScore,
        awayScore,
      },
    })

    return NextResponse.json(guess)
  } catch (error) {
    console.error('Error creating/updating guess:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
