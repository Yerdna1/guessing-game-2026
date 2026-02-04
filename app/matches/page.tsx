import { safeAuth } from '@/lib/safe-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MatchCardWrapper } from '@/components/MatchCardWrapper'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default async function MatchesPage() {
  const session = await safeAuth()

  if (!session?.user) {
    redirect('/login')
  }

  // Get all matches with user's guesses
  const matches = await prisma.match.findMany({
    where: { tournamentId: 'default' },
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
  })

  // Group matches by status
  const scheduled = matches.filter((m) => m.status === 'SCHEDULED')
  const live = matches.filter((m) => m.status === 'LIVE')
  const completed = matches.filter((m) => m.status === 'COMPLETED')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">All Matches</h1>
          <p className="text-xl text-muted-foreground mb-8">
            View and predict all tournament matches
          </p>

          {/* Live Matches */}
          {live.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Live Now
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {live.map((match) => (
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

          {/* Upcoming Matches */}
          {scheduled.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduled.map((match) => (
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

          {/* Completed Matches */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Completed Matches</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map((match) => (
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

          {matches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No matches found
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
