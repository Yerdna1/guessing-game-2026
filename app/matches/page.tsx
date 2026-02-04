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

  // Group matches by date and status
  const matchesByDate = matches.reduce((acc, match) => {
    const dateStr = new Date(match.scheduledTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!acc[dateStr]) {
      acc[dateStr] = []
    }
    acc[dateStr].push(match)
    return acc
  }, {} as Record<string, typeof matches>)

  // Also keep status grouping for compatibility
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

          {/* Display matches grouped by date */}
          {Object.entries(matchesByDate).map(([date, dateMatches], index) => (
            <div key={date} className={index > 0 ? 'mt-12' : 'mb-12'}>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">{date}</h2>

              {/* Live matches for this date */}
              {dateMatches.some(m => m.status === 'LIVE') && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    Live Now
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateMatches.filter(m => m.status === 'LIVE').map((match) => (
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

              {/* Scheduled matches for this date */}
              {dateMatches.some(m => m.status === 'SCHEDULED') && (
                <div className="mb-6">
                  {dateMatches.some(m => m.status === 'LIVE') && (
                    <h3 className="text-lg font-semibold mb-3">Upcoming Today</h3>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateMatches.filter(m => m.status === 'SCHEDULED').map((match) => (
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

              {/* Completed matches for this date */}
              {dateMatches.some(m => m.status === 'COMPLETED') && (
                <div>
                  {(dateMatches.some(m => m.status === 'LIVE') || dateMatches.some(m => m.status === 'SCHEDULED')) && (
                    <h3 className="text-lg font-semibold mb-3">Completed</h3>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateMatches.filter(m => m.status === 'COMPLETED').map((match) => (
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
            </div>
          ))}

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
