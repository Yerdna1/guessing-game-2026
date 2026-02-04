import { safeAuth } from '@/lib/safe-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MatchesByDate } from '@/components/MatchesByDate'

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

  // Transform matches to the format expected by MatchesByDate
  const transformedMatches = matches.map((match) => ({
    id: match.id,
    scheduledTime: match.scheduledTime,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    status: match.status,
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
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">All Matches</h1>
          <p className="text-xl text-muted-foreground mb-8">
            View and predict all tournament matches
          </p>

          <MatchesByDate matches={transformedMatches} isAuthenticated={true} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
