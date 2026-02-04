import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId') || 'default'
    const status = searchParams.get('status')
    const stage = searchParams.get('stage')

    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        ...(status && { status: status as any }),
        ...(stage && { stage: stage as any }),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    })

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { auth } = await import('@/lib/auth')
    const session = await auth()

    const body = await request.json()
    const { matchId, homeScore, awayScore, status } = body

    if (!matchId) {
      return NextResponse.json({ error: 'Missing matchId' }, { status: 400 })
    }

    // Update match
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...(homeScore !== undefined && { homeScore }),
        ...(awayScore !== undefined && { awayScore }),
        ...(status && { status: status as any }),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    })

    return NextResponse.json(match)
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
