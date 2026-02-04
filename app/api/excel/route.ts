import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Calculate points for a guess based on match result
function calculateGuessPoints(
  guessHomeScore: number,
  guessAwayScore: number,
  matchHomeScore: number | null,
  matchAwayScore: number | null,
  isPlayoff: boolean
): { points: number; isCorrect: boolean; isWinner: boolean; isOneTeam: boolean } {
  // If match not completed, no points
  if (matchHomeScore === null || matchAwayScore === null) {
    return { points: 0, isCorrect: false, isWinner: false, isOneTeam: false }
  }

  const points: { points: number; isCorrect: boolean; isWinner: boolean; isOneTeam: boolean } = {
    points: 0,
    isCorrect: guessHomeScore === matchHomeScore && guessAwayScore === matchAwayScore,
    isWinner: false,
    isOneTeam: false
  }

  // Determine actual winner
  const actualWinner = matchHomeScore > matchAwayScore ? 'home' : matchHomeScore < matchAwayScore ? 'away' : 'draw'
  const guessedWinner = guessHomeScore > guessAwayScore ? 'home' : guessHomeScore < guessAwayScore ? 'away' : 'draw'

  // Check if guessed winner correctly
  if (actualWinner === guessedWinner && actualWinner !== 'draw') {
    points.isWinner = true
    points.points = 1 // Base points for correct winner
  }

  // Check if one team score is correct
  if (guessHomeScore === matchHomeScore || guessAwayScore === matchAwayScore) {
    points.isOneTeam = true
    if (points.points === 1) {
      points.points = 2 // Winner + one team correct
    }
  }

  // Exact score
  if (points.isCorrect) {
    points.points = 4 // Exact score
  }

  // Add playoff bonus
  if (isPlayoff && points.points > 0) {
    points.points += 1
  }

  return points
}

// Public endpoint for Excel view - returns all data with calculated statistics
export async function GET(request: NextRequest) {
  try {
    // Get sort parameter from query string
    const url = new URL(request.url)
    const sortBy = url.searchParams.get('sortBy') || 'totalPoints' // name, totalPoints, accurateGuesses, filledMatches
    const sortOrder = url.searchParams.get('sortOrder') || 'desc' // asc or desc

    // Fetch all matches first (needed for calculations)
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
    const allGuesses = await prisma.guess.findMany({
      select: {
        userId: true,
        matchId: true,
        homeScore: true,
        awayScore: true,
        points: true,
      },
    })

    // Fetch users and calculate their statistics
    const usersRaw = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
      },
    })

    // Calculate statistics for each user
    const usersWithStats = usersRaw.map(user => {
      const userGuesses = allGuesses.filter(g => g.userId === user.id)

      // Count filled matches
      const filledMatches = userGuesses.length

      // Calculate points by stage
      let totalPoints = 0
      let groupStagePoints = 0
      let playoffPoints = 0
      let accurateGuesses = 0

      for (const guess of userGuesses) {
        const match = matches.find(m => m.id === guess.matchId)
        if (!match) continue

        const result = calculateGuessPoints(
          guess.homeScore,
          guess.awayScore,
          match.homeScore,
          match.awayScore,
          match.isPlayoff
        )

        totalPoints += result.points

        if (match.isPlayoff) {
          playoffPoints += result.points
        } else {
          groupStagePoints += result.points
        }

        if (result.isCorrect) {
          accurateGuesses++
        }
      }

      return {
        ...user,
        filledMatches,
        totalPoints,
        groupStagePoints,
        playoffPoints,
        accurateGuesses
      }
    })

    // Sort users based on the requested criteria
    const users = usersWithStats.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'totalPoints':
          comparison = b.totalPoints - a.totalPoints
          break
        case 'accurateGuesses':
          comparison = b.accurateGuesses - a.accurateGuesses
          break
        case 'filledMatches':
          comparison = b.filledMatches - a.filledMatches
          break
        case 'name':
        default:
          comparison = (a.name || '').localeCompare(b.name || '')
          break
      }

      // Apply secondary sort (by name) for ties
      if (comparison === 0) {
        comparison = (a.name || '').localeCompare(b.name || '')
      }

      return sortOrder === 'asc' ? -comparison : comparison
    })

    return NextResponse.json({
      users,
      matches,
      guesses: allGuesses,
      sortBy,
      sortOrder
    })
  } catch (error) {
    console.error('Error fetching Excel data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
