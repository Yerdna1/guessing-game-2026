import { safeAuth } from '@/lib/safe-auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, RefreshCw, Save, CheckCircle2 } from 'lucide-react'
import { recalculateRankingsAction, updateMatchResult, updateRules } from '@/app/actions'

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

  // Get existing rules
  let rules = await prisma.rule.findFirst({
    where: { tournamentId: 'default' },
  })

  // Default rules if none exist
  if (!rules) {
    rules = {
      id: '',
      tournamentId: 'default',
      title: 'Game Rules & Scoring',
      description: 'Default scoring rules for the ice hockey guessing game.',
      pointsExact: 4,
      pointsWinner: 1,
      pointsOneTeam: 2,
      playoffBonus: 1,
      createdAt: new Date(),
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-xl text-muted-foreground">
                Manage matches, update scores, and configure rules
              </p>
            </div>
            <form action={recalculateRankingsAction}>
              <Button type="submit" size="lg" className="gap-2">
                <RefreshCw className="h-5 w-5" />
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

          {/* Rules Editor */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Game Rules & Scoring
              </CardTitle>
              <CardDescription>
                Configure the scoring system for the tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateRules} className="space-y-6">
                <input type="hidden" name="ruleId" value={rules.id} />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={rules.title}
                      placeholder="Game Rules & Scoring"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointsExact">Exact Score Points</Label>
                    <Input
                      id="pointsExact"
                      name="pointsExact"
                      type="number"
                      min="0"
                      defaultValue={rules.pointsExact}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointsWinner">Winner Only Points</Label>
                    <Input
                      id="pointsWinner"
                      name="pointsWinner"
                      type="number"
                      min="0"
                      defaultValue={rules.pointsWinner}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointsOneTeam">Winner + One Team Points</Label>
                    <Input
                      id="pointsOneTeam"
                      name="pointsOneTeam"
                      type="number"
                      min="0"
                      defaultValue={rules.pointsOneTeam}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playoffBonus">Playoff Bonus Points</Label>
                    <Input
                      id="playoffBonus"
                      name="playoffBonus"
                      type="number"
                      min="0"
                      defaultValue={rules.playoffBonus}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={rules.description}
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Rules
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Matches Editor */}
          <Card>
            <CardHeader>
              <CardTitle>All Matches</CardTitle>
              <CardDescription>
                Update scores and match status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => (
                  <form
                    key={match.id}
                    action={updateMatchResult}
                    className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <input type="hidden" name="matchId" value={match.id} />

                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Teams */}
                      <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                        <div className="text-center">
                          {match.homeTeam.flagUrl && (
                            <div className="relative w-16 h-12 mx-auto mb-2 rounded-lg overflow-hidden shadow-md border-2 border-emerald-200 dark:border-emerald-800">
                              <Image
                                src={match.homeTeam.flagUrl}
                                alt={match.homeTeam.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <p className="font-semibold">{match.homeTeam.code}</p>
                          <p className="text-sm text-muted-foreground">{match.homeTeam.name}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <Label htmlFor={`homeScore-${match.id}`} className="sr-only">Home Score</Label>
                            <Input
                              id={`homeScore-${match.id}`}
                              name="homeScore"
                              type="number"
                              min="0"
                              placeholder="Home"
                              defaultValue={match.homeScore ?? ''}
                              className="text-center font-bold"
                            />
                          </div>
                          <span className="text-xl font-bold text-muted-foreground">:</span>
                          <div className="w-24">
                            <Label htmlFor={`awayScore-${match.id}`} className="sr-only">Away Score</Label>
                            <Input
                              id={`awayScore-${match.id}`}
                              name="awayScore"
                              type="number"
                              min="0"
                              placeholder="Away"
                              defaultValue={match.awayScore ?? ''}
                              className="text-center font-bold"
                            />
                          </div>
                        </div>

                        <div className="text-center">
                          {match.awayTeam.flagUrl && (
                            <div className="relative w-16 h-12 mx-auto mb-2 rounded-lg overflow-hidden shadow-md border-2 border-blue-200 dark:border-blue-800">
                              <Image
                                src={match.awayTeam.flagUrl}
                                alt={match.awayTeam.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <p className="font-semibold">{match.awayTeam.code}</p>
                          <p className="text-sm text-muted-foreground">{match.awayTeam.name}</p>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center gap-3">
                        <div className="w-40">
                          <Label htmlFor={`status-${match.id}`} className="sr-only">Status</Label>
                          <select
                            id={`status-${match.id}`}
                            name="status"
                            defaultValue={match.status}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                          >
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="LIVE">Live</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>

                        <Button type="submit" size="sm" className="gap-2">
                          <Save className="h-4 w-4" />
                          Save
                        </Button>

                        {match.status === 'COMPLETED' && match.homeScore !== null && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{match.scheduledTime.toLocaleDateString()}</span>
                      <span>{match.stage.replace(/_/g, ' ')}</span>
                      {match.isPlayoff && <span className="text-purple-600 font-semibold">Playoff</span>}
                      {match.venue && <span>{match.venue}</span>}
                    </div>
                  </form>
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
