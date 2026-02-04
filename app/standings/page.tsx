import { prisma } from '@/lib/prisma'
import { StandingsTable } from '@/components/StandingsTable'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default async function StandingsPage() {
  const tournament = await prisma.tournament.findFirst({
    where: { id: 'default' },
  })

  // Get all users and their rankings (if they have any)
  const users = await prisma.user.findMany({
    include: {
      rankings: {
        where: { tournamentId: 'default' },
        take: 1,
      },
    },
  })

  // Transform the data to match the expected format
  const rankings = users
    .map((user) => {
      const ranking = user.rankings[0]
      return {
        place: ranking?.place || null,
        user: {
          name: user.name,
          email: user.email,
          country: user.country,
        },
        totalPoints: ranking?.totalPoints || 0,
        totalGuesses: ranking?.totalGuesses || 0,
        accurateGuesses: ranking?.accurateGuesses || 0,
        groupStagePoints: ranking?.groupStagePoints || 0,
        playoffPoints: ranking?.playoffPoints || 0,
      }
    })
    .sort((a, b) => {
      // Sort by totalPoints desc, then accurateGuesses desc
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints
      }
      return b.accurateGuesses - a.accurateGuesses
    })
    .map((ranking, index) => ({
      ...ranking,
      place: index + 1,
    }))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Standings</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {tournament?.name || 'Tournament'} Rankings
          </p>

          <StandingsTable rankings={rankings} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
