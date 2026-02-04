import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint for Excel view - returns all data
export async function GET() {
  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Fetch all matches
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: 'default',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    })

    // Fetch all guesses
    const guesses = await prisma.guess.findMany({
      select: {
        userId: true,
        matchId: true,
        homeScore: true,
        awayScore: true,
        points: true,
      },
    })

    return NextResponse.json({
      users,
      matches,
      guesses,
    })
  } catch (error) {
    console.error('Error fetching Excel data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}