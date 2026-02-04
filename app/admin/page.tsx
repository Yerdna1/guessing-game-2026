import { safeAuth } from '@/lib/safe-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, RefreshCw, Plus, Save, Users } from 'lucide-react'
import { recalculateRankingsAction, updateRules, createMatch } from '@/app/actions'
import { AdminMatchesList } from '@/components/AdminMatchesList'
import { AdminUsersList } from '@/components/AdminUsersList'
import { DeleteUserButton } from '@/components/DeleteUserButton'

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

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      country: true,
      role: true,
      _count: {
        select: {
          guesses: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
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
              <AdminMatchesList matches={matches} />
            </CardContent>
          </Card>

          {/* Users Management */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Create, edit, and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUsersList users={users} />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
