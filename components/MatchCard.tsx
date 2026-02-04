'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Flag } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Image from 'next/image'

export interface Match {
  id: string
  scheduledTime: Date
  homeTeam: {
    code: string
    name: string
    flagUrl?: string | null
  }
  awayTeam: {
    code: string
    name: string
    flagUrl?: string | null
  }
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  homeScore?: number | null
  awayScore?: number | null
  stage: string
  venue?: string | null
  isPlayoff: boolean
  userGuess?: {
    homeScore: number
    awayScore: number
    points: number
  } | null
}

interface MatchCardProps {
  match: Match
  isAuthenticated: boolean
  onSubmitGuess?: (matchId: string, homeScore: number, awayScore: number) => Promise<void>
  onGetAIPrediction?: (matchId: string) => Promise<{ homeScore: number; awayScore: number; reasoning: string }>
}

export function MatchCard({ match, isAuthenticated, onSubmitGuess, onGetAIPrediction }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState(match.userGuess?.homeScore?.toString() || '')
  const [awayScore, setAwayScore] = useState(match.userGuess?.awayScore?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiPrediction, setAiPrediction] = useState<{ homeScore: number; awayScore: number; reasoning: string } | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditable = match.status === 'SCHEDULED'
  const isLive = match.status === 'LIVE'
  const isCompleted = match.status === 'COMPLETED'

  const getStatusBadge = () => {
    if (isLive) {
      return <Badge className="bg-red-500 hover:bg-red-600">LIVE</Badge>
    }
    if (isCompleted) {
      return <Badge variant="secondary">FINAL</Badge>
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditable || !onSubmitGuess) return

    const home = parseInt(homeScore)
    const away = parseInt(awayScore)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setError('Please enter valid scores (non-negative numbers)')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmitGuess(match.id, home, away)
    } catch (err) {
      setError('Failed to submit guess. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGetAIPrediction = async () => {
    if (!onGetAIPrediction) return

    setIsLoadingAI(true)
    try {
      const prediction = await onGetAIPrediction(match.id)
      setAiPrediction(prediction)
      setHomeScore(prediction.homeScore.toString())
      setAwayScore(prediction.awayScore.toString())
    } catch (err) {
      setError('Failed to get AI prediction. Please try again.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {match.homeTeam.code} vs {match.awayTeam.code}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {match.isPlayoff && (
              <Badge variant="outline" className="text-xs">
                Playoffs
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(match.scheduledTime)}
        </p>
        {match.venue && (
          <p className="text-xs text-muted-foreground">
            {match.venue}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            {match.homeTeam.flagUrl && (
              <div className="relative w-16 h-12 mx-auto mb-2">
                <Image
                  src={match.homeTeam.flagUrl}
                  alt={match.homeTeam.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            <p className="font-medium">{match.homeTeam.code}</p>
          </div>

          {/* Score / Input */}
          <div className="flex items-center gap-3">
            {(isCompleted || isLive) && match.homeScore !== null && match.awayScore !== null ? (
              <div className="text-3xl font-bold">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : isAuthenticated && isEditable ? (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-16 text-center"
                  placeholder="-"
                />
                <span className="text-xl font-bold">-</span>
                <Input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-16 text-center"
                  placeholder="-"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="ml-2"
                >
                  {isSubmitting ? '...' : 'Save'}
                </Button>
                {onGetAIPrediction && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGetAIPrediction}
                    disabled={isLoadingAI}
                    title="Get AI prediction"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
              </form>
            ) : (
              <div className="text-xl font-bold text-muted-foreground">vs</div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            {match.awayTeam.flagUrl && (
              <div className="relative w-16 h-12 mx-auto mb-2">
                <Image
                  src={match.awayTeam.flagUrl}
                  alt={match.awayTeam.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            <p className="font-medium">{match.awayTeam.code}</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-3">{error}</p>
        )}

        {aiPrediction && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">AI Prediction:</p>
            <p className="text-xs text-muted-foreground">{aiPrediction.reasoning}</p>
          </div>
        )}

        {match.userGuess && isEditable && (
          <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              Your guess: {match.userGuess.homeScore} - {match.userGuess.awayScore}
              {match.userGuess.points > 0 && ` (${match.userGuess.points} pts)`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
