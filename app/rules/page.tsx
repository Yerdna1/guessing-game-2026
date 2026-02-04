import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Target, Award } from 'lucide-react'

export default function RulesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Game Rules & Scoring</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Learn how to play and earn points in the IBM & Olympic Games 2026 Ice Hockey Guessing Game
          </p>

          {/* Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Game Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Welcome to the IBM & Olympic Games 2026 Ice Hockey Guessing Game! Your goal is to predict the scores
                of ice hockey matches during the Olympic tournament in Milan & Cortina, Italy.
              </p>
              <p>
                Before each match begins, submit your prediction for the final score. After the match concludes,
                you'll earn points based on the accuracy of your prediction.
              </p>
              <p>
                Compete with friends and other fans to climb the leaderboard and see who has the best hockey intuition!
              </p>
            </CardContent>
          </Card>

          {/* Scoring System */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" />
                Scoring System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Points are awarded after each match based on how accurate your prediction was:
              </p>

              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-950 rounded-r-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg">Exact Score</h3>
                    <Badge className="bg-green-500 hover:bg-green-600 text-lg px-3 py-1">4 pts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You predicted the exact final score (e.g., you predicted 3-2 and the final score was 3-2)
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-r-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg">Winner + One Team Score</h3>
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-lg px-3 py-1">2 pts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You correctly predicted the winner AND got one team's score right (e.g., predicted 3-1, actual 3-2)
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 dark:bg-yellow-950 rounded-r-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg">Correct Winner Only</h3>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-lg px-3 py-1">1 pt</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You correctly predicted which team would win, but didn't get any scores exactly right
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Playoff Bonus
                </h4>
                <p className="text-sm">
                  All playoff matches (quarterfinals, semifinals, bronze medal, and gold medal games) include a
                  <span className="font-bold"> +1 bonus point</span> added to each scoring tier.
                  So exact scores in playoff matches are worth <span className="font-bold">5 points</span> instead of 4!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How to Play */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong>Create an account</strong> - Register with your email or sign in with Google/GitHub
                </li>
                <li>
                  <strong>Browse upcoming matches</strong> - See the schedule of upcoming hockey matches
                </li>
                <li>
                  <strong>Submit your prediction</strong> - Enter your predicted score for both teams before the match starts
                </li>
                <li>
                  <strong>Watch the match</strong> - Cheer for your predicted score (or your favorite team!)
                </li>
                <li>
                  <strong>Earn points</strong> - After the match, points are automatically calculated based on the actual result
                </li>
                <li>
                  <strong>Climb the leaderboard</strong> - Check your ranking and see how you compare to other players
                </li>
              </ol>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  )
}
