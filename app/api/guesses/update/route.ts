import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, matchId, homeScore, awayScore } = body

    // Validate input
    if (!userId || !matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate scores are non-negative integers
    const home = parseInt(homeScore)
    const away = parseInt(awayScore)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      return NextResponse.json(
        { error: 'Scores must be non-negative integers' },
        { status: 400 }
      )
    }

    // Check if guess exists
    const existingGuess = await prisma.guess.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId
        }
      }
    })

    if (existingGuess) {
      // Update existing guess
      const updatedGuess = await prisma.guess.update({
        where: {
          userId_matchId: {
            userId,
            matchId
          }
        },
        data: {
          homeScore: home,
          awayScore: away
        }
      })

      return NextResponse.json({
        success: true,
        guess: updatedGuess
      })
    } else {
      // Create new guess
      const newGuess = await prisma.guess.create({
        data: {
          userId,
          matchId,
          homeScore: home,
          awayScore: away
        }
      })

      return NextResponse.json({
        success: true,
        guess: newGuess
      })
    }
  } catch (error) {
    console.error('Error updating guess:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
