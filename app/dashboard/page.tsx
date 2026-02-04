import { safeAuth } from '@/lib/safe-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MatchCardWrapper } from '@/components/MatchCardWrapper'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await safeAuth()

  if (!session?.user) {
    redirect('/login')
  }

  // Get user's ranking
  const userRanking = await prisma.ranking.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId: 'default',
        userId: session.user.id,
      },
    },
  })

  // Get upcoming matches with user's guesses
  const upcomingMatches = await prisma.match.findMany({
    where: {
      tournamentId: 'default',
      status: 'SCHEDULED',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      guesses: {
        where: {
          userId: session.user.id,
        },
      },
    },
    orderBy: {
      scheduledTime: 'asc',
    },
    take: 5,
  })

  // Get completed matches with user's guesses
  const completedMatches = await prisma.match.findMany({
    where: {
      tournamentId: 'default',
      status: 'COMPLETED',
      guesses: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      guesses: {
        where: {
          userId: session.user.id,
        },
      },
    },
    orderBy: {
      scheduledTime: 'desc',
    },
    take: 5,
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Welcome, {session.user.name || 'Player'}!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Ready to make your predictions?
          </p>

          {/* User Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Your Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  #{userRanking?.place || '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {userRanking?.totalPoints || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Accurate Guesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {userRanking?.accurateGuesses || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Guesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {userRanking?.totalGuesses || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Matches */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
            {upcomingMatches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming matches scheduled
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match) => (
                  <MatchCardWrapper
                    key={match.id}
                    match={{
                      id: match.id,
                      scheduledTime: match.scheduledTime,
                      homeTeam: match.homeTeam,
                      awayTeam: match.awayTeam,
                      status: match.status as any,
                      homeScore: match.homeScore,
                      awayScore: match.awayScore,
                      stage: match.stage,
                      venue: match.venue,
                      isPlayoff: match.isPlayoff,
                      matchNumber: match.matchNumber,
                      userGuess: match.guesses[0] ? {
                        homeScore: match.guesses[0].homeScore,
                        awayScore: match.guesses[0].awayScore,
                        points: match.guesses[0].points,
                      } : null,
                    }}
                    isAuthenticated={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Results */}
          {completedMatches.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedMatches.map((match) => (
                  <MatchCardWrapper
                    key={match.id}
                    match={{
                      id: match.id,
                      scheduledTime: match.scheduledTime,
                      homeTeam: match.homeTeam,
                      awayTeam: match.awayTeam,
                      status: match.status as any,
                      homeScore: match.homeScore,
                      awayScore: match.awayScore,
                      stage: match.stage,
                      venue: match.venue,
                      isPlayoff: match.isPlayoff,
                      matchNumber: match.matchNumber,
                      userGuess: match.guesses[0] ? {
                        homeScore: match.guesses[0].homeScore,
                        awayScore: match.guesses[0].awayScore,
                        points: match.guesses[0].points,
                      } : null,
                    }}
                    isAuthenticated={true}
                  />
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
