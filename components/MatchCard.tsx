'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Flag, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'
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
  matchNumber?: number | null
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
      return (
        <Badge className="gap-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1 shadow-lg animate-pulse">
          <Clock className="h-3 w-3" />
          LIVE NOW
        </Badge>
      )
    }
    if (isCompleted) {
      return (
        <Badge className="gap-1 bg-slate-700 text-white font-semibold px-3 py-1">
          FINAL
        </Badge>
      )
    }
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 font-semibold px-3 py-1 border-2 border-emerald-300">
        UPCOMING
      </Badge>
    )
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

  const cardClass = `match-card ${
    isLive ? 'match-card-live' : isCompleted ? 'match-card-completed' : 'match-card-scheduled'
  }`

  return (
    <Card className={cardClass}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {match.matchNumber && (
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-xs px-2 py-1 shadow-md">
                  #{match.matchNumber}
                </Badge>
              )}
              {getStatusBadge()}
              {match.isPlayoff && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-xs px-2 py-1 shadow-md">
                  🏆 Playoff
                </Badge>
              )}
              <Badge className="bg-slate-100 text-slate-700 font-semibold text-xs px-2 py-1 border border-slate-300">
                {match.stage.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{formatDateTime(match.scheduledTime)}</span>
              </div>
              {match.venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{match.venue}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="relative inline-block mb-3">
              {match.homeTeam.flagUrl && (
                <div className="relative w-20 h-14 mx-auto mb-2 rounded-lg overflow-hidden shadow-md border-2 border-emerald-200 dark:border-emerald-800">
                  <Image
                    src={match.homeTeam.flagUrl}
                    alt={match.homeTeam.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{match.homeTeam.code}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{match.homeTeam.name}</p>
          </div>

          {/* Score Section */}
          <div className="flex-1 flex flex-col items-center">
            {(isCompleted || isLive) && match.homeScore !== null && match.awayScore !== null ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl shadow-xl border-4 border-slate-300 dark:border-slate-600">
                  <div className="score-badge score-badge-home">{match.homeScore}</div>
                  <span className="text-2xl font-bold text-slate-300">-</span>
                  <div className="score-badge score-badge-away">{match.awayScore}</div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Final Score</p>
              </div>
            ) : isAuthenticated && isEditable ? (
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex items-center justify-center gap-3">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max={20}
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-16 h-14 text-center text-xl font-bold border-2 border-emerald-300 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl bg-white dark:bg-slate-800"
                      placeholder="-"
                    />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">Home</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-400">:</span>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max={20}
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-16 h-14 text-center text-xl font-bold border-2 border-emerald-300 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl bg-white dark:bg-slate-800"
                      placeholder="-"
                    />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium">Away</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Prediction'
                    )}
                  </Button>
                  {onGetAIPrediction && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGetAIPrediction}
                      disabled={isLoadingAI}
                      className="border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300"
                      title="Get AI prediction"
                    >
                      <Sparkles className={`h-4 w-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <span className="text-2xl font-bold text-slate-400">VS</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {!isAuthenticated ? 'Sign in to predict' : 'Match locked'}
                </p>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className="relative inline-block mb-3">
              {match.awayTeam.flagUrl && (
                <div className="relative w-20 h-14 mx-auto mb-2 rounded-lg overflow-hidden shadow-md border-2 border-blue-200 dark:border-blue-800">
                  <Image
                    src={match.awayTeam.flagUrl}
                    alt={match.awayTeam.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <span className="font-bold text-blue-700 dark:text-blue-300">{match.awayTeam.code}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{match.awayTeam.name}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium text-center">{error}</p>
          </div>
        )}

        {/* AI Prediction */}
        {aiPrediction && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-1">AI Prediction</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">{aiPrediction.reasoning}</p>
                <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mt-2">
                  Predicted: {aiPrediction.homeScore} - {aiPrediction.awayScore}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User's Guess */}
        {match.userGuess && isEditable && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <Flag className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Your Prediction</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {match.userGuess.homeScore} - {match.userGuess.awayScore}
                </span>
                {match.userGuess.points > 0 && (
                  <Badge className="ml-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-2 py-1">
                    +{match.userGuess.points} pts
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
