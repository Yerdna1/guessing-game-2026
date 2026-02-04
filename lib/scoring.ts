import { prisma } from './prisma'

export interface ScoringResult {
  points: number
  isCorrect: boolean
  isWinner: boolean
  isOneTeam: boolean
}

/**
 * Calculate points for a guess based on actual match result
 * Scoring rules:
 * - Exact score: 4 points
 * - Winner + one team correct: 2 points
 * - Just winner: 1 point
 * - Playoff: +1 bonus point for each scenario
 */
export function calculateGuessPoints(
  homeGuess: number,
  awayGuess: number,
  homeActual: number,
  awayActual: number,
  isPlayoff: boolean = false
): ScoringResult {
  const result: ScoringResult = {
    points: 0,
    isCorrect: false,
    isWinner: false,
    isOneTeam: false,
  }

  // Determine winner (null for draw)
  const guessWinner = homeGuess > awayGuess ? 'home' : homeGuess < awayGuess ? 'away' : null
  const actualWinner = homeActual > awayActual ? 'home' : homeActual < awayActual ? 'away' : null

  // Check for exact score
  if (homeGuess === homeActual && awayGuess === awayActual) {
    result.isCorrect = true
    result.isWinner = true
    result.isOneTeam = true
    result.points = 4 + (isPlayoff ? 1 : 0)
    return result
  }

  // Check if winner is correct
  if (guessWinner === actualWinner) {
    result.isWinner = true

    // Check if one team score is correct
    if (homeGuess === homeActual || awayGuess === awayActual) {
      result.isOneTeam = true
      result.points = 2 + (isPlayoff ? 1 : 0)
    } else {
      result.points = 1 + (isPlayoff ? 1 : 0)
    }
  }

  return result
}

/**
 * Recalculate all rankings for a tournament
 */
export async function recalculateRankings(tournamentId: string) {
  // Get all users with guesses in this tournament
  const usersWithGuesses = await prisma.user.findMany({
    where: {
      guesses: {
        some: {
          match: {
            tournamentId,
          },
        },
      },
    },
    include: {
      guesses: {
        where: {
          match: {
            tournamentId,
          },
        },
        include: {
          match: {
            select: {
              isPlayoff: true,
              homeScore: true,
              awayScore: true,
              status: true,
            },
          },
        },
      },
    },
  })

  const rules = await prisma.rule.findFirst({
    where: { tournamentId },
  })

  const rankings: Array<{
    userId: string
    totalPoints: number
    totalGuesses: number
    accurateGuesses: number
    groupStagePoints: number
    playoffPoints: number
  }> = []

  for (const user of usersWithGuesses) {
    let totalPoints = 0
    let groupStagePoints = 0
    let playoffPoints = 0
    let accurateGuesses = 0
    let totalGuesses = 0

    for (const guess of user.guesses) {
      // Only calculate points for completed matches
      if (guess.match.status === 'COMPLETED' && guess.match.homeScore !== null && guess.match.awayScore !== null) {
        const scoring = calculateGuessPoints(
          guess.homeScore,
          guess.awayScore,
          guess.match.homeScore,
          guess.match.awayScore,
          guess.match.isPlayoff
        )

        totalPoints += scoring.points
        totalGuesses++

        if (scoring.isCorrect) {
          accurateGuesses++
        }

        if (guess.match.isPlayoff) {
          playoffPoints += scoring.points
        } else {
          groupStagePoints += scoring.points
        }

        // Update the guess with calculated points
        await prisma.guess.update({
          where: { id: guess.id },
          data: {
            points: scoring.points,
            isCorrect: scoring.isCorrect,
            isWinner: scoring.isWinner,
            isOneTeam: scoring.isOneTeam,
          },
        })
      }
    }

    rankings.push({
      userId: user.id,
      totalPoints,
      totalGuesses,
      accurateGuesses,
      groupStagePoints,
      playoffPoints,
    })
  }

  // Sort by total points descending
  rankings.sort((a, b) => b.totalPoints - a.totalPoints)

  // Update or create rankings
  for (let i = 0; i < rankings.length; i++) {
    const ranking = rankings[i]

    await prisma.ranking.upsert({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: ranking.userId,
        },
      },
      update: {
        place: i + 1,
        totalPoints: ranking.totalPoints,
        totalGuesses: ranking.totalGuesses,
        accurateGuesses: ranking.accurateGuesses,
        groupStagePoints: ranking.groupStagePoints,
        playoffPoints: ranking.playoffPoints,
        lastCalculated: new Date(),
      },
      create: {
        tournamentId,
        userId: ranking.userId,
        place: i + 1,
        totalPoints: ranking.totalPoints,
        totalGuesses: ranking.totalGuesses,
        accurateGuesses: ranking.accurateGuesses,
        groupStagePoints: ranking.groupStagePoints,
        playoffPoints: ranking.playoffPoints,
      },
    })
  }

  return rankings
}

/**
 * Get user's current ranking
 */
export async function getUserRanking(tournamentId: string, userId: string) {
  const ranking = await prisma.ranking.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          country: true,
        },
      },
    },
  })

  return ranking
}

/**
 * Get top rankings for a tournament
 */
export async function getTopRankings(tournamentId: string, limit: number = 50) {
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
    take: limit,
  })

  return rankings
}
