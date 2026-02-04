import { safeAuth } from '@/lib/safe-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchCardWrapper } from '@/components/MatchCardWrapper'
import { Settings } from 'lucide-react'
import { recalculateRankingsAction } from '@/app/actions'

export default async function AdminPage() {
  const session = await safeAuth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Get all matches
  const matches = await prisma.match.findMany({
    where: { tournamentId: 'default' },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      scheduledTime: 'asc',
    },
  })

  // Get tournament stats
  const totalMatches = await prisma.match.count({
    where: { tournamentId: 'default' },
  })

  const completedMatches = await prisma.match.count({
    where: {
      tournamentId: 'default',
      status: 'COMPLETED',
    },
  })

  const totalUsers = await prisma.user.count()

  const totalGuesses = await prisma.guess.count()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-xl text-muted-foreground">
                Manage matches and update scores
              </p>
            </div>
            <form action={recalculateRankingsAction}>
              <Button type="submit">
                Recalculate Rankings
              </Button>
            </form>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalMatches}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{completedMatches}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Guesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalGuesses}</div>
              </CardContent>
            </Card>
          </div>

          {/* Matches */}
          <Card>
            <CardHeader>
              <CardTitle>All Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match) => (
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
                    }}
                    isAuthenticated={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
