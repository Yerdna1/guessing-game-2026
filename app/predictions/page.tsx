import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Eye, TrendingUp } from 'lucide-react'

type MatchWithRelations = {
  id: string
  tournamentId: string
  homeTeamId: string
  awayTeamId: string
  scheduledTime: Date
  venue: string | null
  stage: string
  status: string
  homeScore: number | null
  awayScore: number | null
  isPlayoff: boolean
  createdAt: Date
  updatedAt: Date
  homeTeam: {
    id: string
    code: string
    name: string
    flagUrl: string | null
  }
  awayTeam: {
    id: string
    code: string
    name: string
    flagUrl: string | null
  }
  guesses: {
    id: string
    userId: string
    matchId: string
    homeScore: number
    awayScore: number
    points: number
    isCorrect: boolean
    isWinner: boolean
    isOneTeam: boolean
    user: {
      id: string
      name: string | null
      email: string
      country: string | null
    }
  }[]
}

type UserWithGuessesAndRankings = {
  id: string
  name: string | null
  email: string
  country: string | null
  guesses: { points: number }[]
  rankings: {
    id: string
    tournamentId: string
    userId: string
    place: number | null
    totalGuesses: number
    accurateGuesses: number
    groupStagePoints: number
    playoffPoints: number
    totalPoints: number
    lastCalculated: Date
  }[]
}

type UserWithStats = UserWithGuessesAndRankings & {
  totalPoints: number
  totalGuesses: number
  accurateGuesses: number
}

export default async function PredictionsPage() {
  // Get all matches with all guesses
  const matches = await prisma.match.findMany({
    where: { tournamentId: 'default' },
    include: {
      homeTeam: true,
      awayTeam: true,
      guesses: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              country: true,
            },
          },
        },
        orderBy: {
          points: 'desc',
        },
      },
    },
    orderBy: {
      scheduledTime: 'asc',
    },
  }) as MatchWithRelations[]

  // Get all users with their stats
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      country: true,
      guesses: {
        select: {
          points: true,
        },
      },
      rankings: {
        where: {
          tournamentId: 'default',
        },
      },
    },
  }) as UserWithGuessesAndRankings[]

  // Calculate user stats
  const userStats: UserWithStats[] = users.map((user: UserWithGuessesAndRankings) => ({
    ...user,
    totalPoints: user.rankings[0]?.totalPoints || 0,
    totalGuesses: user.guesses.length,
    accurateGuesses: user.guesses.filter((g: { points: number }) => g.points > 0).length,
  })).sort((a: UserWithStats, b: UserWithStats) => b.totalPoints - a.totalPoints)

  // Separate upcoming and completed matches
  const upcomingMatches = matches.filter((m: MatchWithRelations) => m.status === 'SCHEDULED')
  const completedMatches = matches.filter((m: MatchWithRelations) => m.status === 'COMPLETED')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Users className="h-10 w-10 text-primary" />
              Public Predictions
            </h1>
            <p className="text-xl text-muted-foreground">
              See what everyone else is predicting! All tips and odds from players.
            </p>
          </div>

          {/* Top Predictors */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Predictors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                {userStats.slice(0, 5).map((user: UserWithStats, index: number) => (
                  <div
                    key={user.id}
                    className="flex flex-col items-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {user.totalPoints} pts
                      </Badge>
                    </div>
                    <div className="font-semibold text-center">{user.name || user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.accurateGuesses}/{user.totalGuesses} correct
                    </div>
                    {user.country && (
                      <div className="text-xs text-muted-foreground">{user.country}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Matches with Predictions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Upcoming Matches - All Predictions
            </h2>

            {upcomingMatches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming matches
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {upcomingMatches.map((match: MatchWithRelations) => (
                  <Card key={match.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {match.homeTeam.flagUrl && (
                              <img
                                src={match.homeTeam.flagUrl}
                                alt={match.homeTeam.name}
                                className="w-8 h-6 object-cover rounded"
                              />
                            )}
                            <span>{match.homeTeam.name}</span>
                          </div>
                          <span className="text-muted-foreground">vs</span>
                          <div className="flex items-center gap-2">
                            {match.awayTeam.flagUrl && (
                              <img
                                src={match.awayTeam.flagUrl}
                                alt={match.awayTeam.name}
                                className="w-8 h-6 object-cover rounded"
                              />
                            )}
                            <span>{match.awayTeam.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {match.stage && <Badge variant="outline">{match.stage}</Badge>}
                          {new Date(match.scheduledTime).toLocaleDateString()}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {match.guesses.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          No predictions yet
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-center">Home</TableHead>
                                <TableHead className="text-center">Away</TableHead>
                                <TableHead className="text-center">Prediction</TableHead>
                                <TableHead>Country</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {match.guesses.map((guess: typeof match.guesses[0]) => (
                                <TableRow key={guess.id}>
                                  <TableCell className="font-medium">
                                    {guess.user.name || guess.user.email}
                                  </TableCell>
                                  <TableCell className="text-center text-lg font-bold text-primary">
                                    {guess.homeScore}
                                  </TableCell>
                                  <TableCell className="text-center text-lg font-bold text-primary">
                                    {guess.awayScore}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant={
                                        guess.homeScore > guess.awayScore
                                          ? 'default'
                                          : guess.awayScore > guess.homeScore
                                          ? 'secondary'
                                          : 'outline'
                                      }
                                    >
                                      {guess.homeScore > guess.awayScore
                                        ? match.homeTeam.code
                                        : guess.awayScore > guess.homeScore
                                        ? match.awayTeam.code
                                        : 'Draw'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {guess.user.country || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Prediction Summary */}
                      {match.guesses.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="text-sm font-medium mb-2">Prediction Summary:</div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Home wins:</span>{' '}
                              <span className="font-bold">
                                {match.guesses.filter((g: typeof match.guesses[0]) => g.homeScore > g.awayScore).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Away wins:</span>{' '}
                              <span className="font-bold">
                                {match.guesses.filter((g: typeof match.guesses[0]) => g.awayScore > g.homeScore).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Draws:</span>{' '}
                              <span className="font-bold">
                                {match.guesses.filter((g: typeof match.guesses[0]) => g.homeScore === g.awayScore).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg score:</span>{' '}
                              <span className="font-bold">
                                {Math.round(
                                  (match.guesses.reduce((sum: number, g: typeof match.guesses[0]) => sum + g.homeScore, 0) * 10) /
                                  match.guesses.length
                                ) / 10}
                                {' - '}
                                {Math.round(
                                  (match.guesses.reduce((sum: number, g: typeof match.guesses[0]) => sum + g.awayScore, 0) * 10) /
                                  match.guesses.length
                                ) / 10}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Matches with Results */}
          {completedMatches.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Completed Matches - Results & How Everyone Did</h2>
              <div className="space-y-6">
                {completedMatches.map((match: MatchWithRelations) => (
                  <Card key={match.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {match.homeTeam.flagUrl && (
                              <img
                                src={match.homeTeam.flagUrl}
                                alt={match.homeTeam.name}
                                className="w-8 h-6 object-cover rounded"
                              />
                            )}
                            <span>{match.homeTeam.name}</span>
                            <span className="font-bold text-primary">{match.homeScore}</span>
                          </div>
                          <span className="text-muted-foreground">-</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{match.awayScore}</span>
                            {match.awayTeam.flagUrl && (
                              <img
                                src={match.awayTeam.flagUrl}
                                alt={match.awayTeam.name}
                                className="w-8 h-6 object-cover rounded"
                              />
                            )}
                            <span>{match.awayTeam.name}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{match.stage}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {match.guesses.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          No predictions were made
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-center">Prediction</TableHead>
                                <TableHead className="text-center">Result</TableHead>
                                <TableHead className="text-center">Points</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {match.guesses
                                .sort((a: typeof match.guesses[0], b: typeof match.guesses[0]) => b.points - a.points)
                                .map((guess: typeof match.guesses[0]) => (
                                  <TableRow key={guess.id}>
                                    <TableCell className="font-medium">
                                      {guess.user.name || guess.user.email}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {guess.homeScore} - {guess.awayScore}
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                      {match.homeScore} - {match.awayScore}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {guess.points > 0 ? (
                                        <Badge className="bg-green-500">
                                          +{guess.points}
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary">0</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
