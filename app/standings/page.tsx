import { prisma } from '@/lib/prisma'
import { StandingsTable } from '@/components/StandingsTable'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default async function StandingsPage() {
  const tournament = await prisma.tournament.findFirst({
    where: { id: 'default' },
  })

  const rankings = await prisma.ranking.findMany({
    where: { tournamentId: 'default' },
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
