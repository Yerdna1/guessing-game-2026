import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Public endpoint for Excel view admin editing
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, matchId, homeScore, awayScore } = body

    console.log('Excel save request:', { userId, matchId, homeScore, awayScore })

    // Validate input
    if (!userId || !matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate scores are non-negative integers
    const home = parseInt(homeScore.toString())
    const away = parseInt(awayScore.toString())

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      return NextResponse.json(
        { error: 'Scores must be non-negative integers' },
        { status: 400 }
      )
    }

    // Verify user and match exist
    const [user, match] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.match.findUnique({ where: { id: matchId } })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Upsert the guess
    const guess = await prisma.guess.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId
        }
      },
      update: {
        homeScore: home,
        awayScore: away,
        updatedAt: new Date()
      },
      create: {
        userId,
        matchId,
        homeScore: home,
        awayScore: away
      }
    })

    console.log('Guess saved:', guess)

    // Revalidate pages to show updated data
    revalidatePath('/excel')

    return NextResponse.json({
      success: true,
      guess
    })
  } catch (error) {
    console.error('Error saving Excel guess:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}