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
import { Settings, RefreshCw, Save, CheckCircle2, Trash2, Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react'
import { recalculateRankingsAction, updateMatchResult, updateRules, createMatch, deleteMatch } from '@/app/actions'

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
      matchNumber: 'asc',
    },
  })

  // Get all teams for the create match form
  const teams = await prisma.team.findMany({
    orderBy: { code: 'asc' }
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
                Create, edit, delete matches and update scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Create New Match Form */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Create New Match</h3>
                </div>
                <form action={createMatch} className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeTeam">Home Team</Label>
                    <select
                      id="homeTeam"
                      name="homeTeamId"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select home team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.code} - {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="awayTeam">Away Team</Label>
                    <select
                      id="awayTeam"
                      name="awayTeamId"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select away team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.code} - {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="scheduledDate">Date</Label>
                    <Input
                      id="scheduledDate"
                      name="scheduledDate"
                      type="date"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="scheduledTime">Time</Label>
                    <Input
                      id="scheduledTime"
                      name="scheduledTime"
                      type="time"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      name="venue"
                      placeholder="e.g., Milano Santagiulia"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stage">Stage</Label>
                    <select
                      id="stage"
                      name="stage"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="GROUP_STAGE">Group Stage</option>
                      <option value="QUARTERFINAL">Quarterfinal</option>
                      <option value="SEMIFINAL">Semifinal</option>
                      <option value="BRONZE_MATCH">Bronze Match</option>
                      <option value="FINAL">Final</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPlayoff"
                      name="isPlayoff"
                      value="true"
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isPlayoff" className="cursor-pointer">Playoff Match</Label>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Match
                    </Button>
                  </div>
                </form>
              </div>

              {/* Existing Matches */}
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Match Header with Number and Delete */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-full shadow-md">
                          #{match.matchNumber}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {new Date(match.scheduledTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <form action={deleteMatch} className="inline">
                        <input type="hidden" name="matchId" value={match.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </form>
                    </div>

                    <form action={updateMatchResult}>
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
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(match.scheduledTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}</span>
                      </div>
                      <span className="text-purple-600 font-semibold">{match.stage.replace(/_/g, ' ')}</span>
                      {match.isPlayoff && <span className="text-purple-600 font-semibold">Playoff</span>}
                      {match.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{match.venue}</span>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
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
