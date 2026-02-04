import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recalculateRankings } from '@/lib/scoring'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId') || 'default'

    const rankings = await prisma.ranking.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            country: true,
          },
        },
      },
      orderBy: [
        { totalPoints: 'desc' },
        { accurateGuesses: 'desc' },
      ],
    })

    return NextResponse.json(rankings)
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, allow anyone to trigger recalculation (in production, restrict to admins)
    const body = await request.json()
    const tournamentId = body.tournamentId || 'default'

    const rankings = await recalculateRankings(tournamentId)

    return NextResponse.json({
      message: 'Rankings recalculated successfully',
      rankings,
    })
  } catch (error) {
    console.error('Error recalculating rankings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
