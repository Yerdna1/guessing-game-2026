'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, TrendingUp, Target, CheckCircle } from 'lucide-react'

export interface RankingEntry {
  place: number | null
  user: {
    name: string | null
    email: string
    country: string | null
  }
  totalPoints: number
  totalGuesses: number
  accurateGuesses: number
  groupStagePoints: number
  playoffPoints: number
}

interface StandingsTableProps {
  rankings: RankingEntry[]
  title?: string
  showUserInfo?: boolean
}

export function StandingsTable({ rankings, title = 'Standings', showUserInfo = true }: StandingsTableProps) {
  const getPlaceIcon = (place: number | null) => {
    if (place === null) return null
    switch (place) {
      case 1:
        return (
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full blur-sm"></div>
              <Trophy className="relative h-8 w-8 text-yellow-500" strokeWidth={2.5} />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full blur-sm"></div>
              <Medal className="relative h-7 w-7 text-slate-400" strokeWidth={2} />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full blur-sm"></div>
              <Award className="relative h-7 w-7 text-amber-700" strokeWidth={2} />
            </div>
          </div>
        )
      default:
        return (
          <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
            #{place}
          </span>
        )
    }
  }

  const getAccuracyPercentage = (accurate: number, total: number) => {
    if (total === 0) return '0%'
    return `${Math.round((accurate / total) * 100)}%`
  }

  const getAccuracyColor = (accurate: number, total: number) => {
    const percentage = total === 0 ? 0 : (accurate / total) * 100
    if (percentage >= 60) return 'text-emerald-600 dark:text-emerald-400'
    if (percentage >= 40) return 'text-blue-600 dark:text-blue-400'
    if (percentage >= 20) return 'text-amber-600 dark:text-amber-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  const getRowBackground = (index: number) => {
    return index % 2 === 0
      ? 'bg-white dark:bg-slate-900'
      : 'bg-emerald-50/50 dark:bg-emerald-950/30'
  }

  return (
    <Card className="overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 border-b-4 border-emerald-700 dark:border-emerald-900">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
            <p className="text-emerald-100 text-sm mt-1">Current tournament rankings</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-emerald-100 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Live Rankings</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>{rankings.length} Players</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="excel-table">
            <thead>
              <tr>
                <th className="w-20 text-center">#</th>
                {showUserInfo && <th className="min-w-[200px]">Player</th>}
                <th className="text-right w-24">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Points
                  </div>
                </th>
                <th className="text-right w-24">Guesses</th>
                <th className="text-right w-24">
                  <div className="flex items-center justify-end gap-1">
                    <Target className="h-4 w-4" />
                    Exact
                  </div>
                </th>
                <th className="text-right w-28">Group</th>
                <th className="text-right w-28">Playoff</th>
                <th className="text-right w-32">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={showUserInfo ? 8 : 7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Trophy className="h-12 w-12 opacity-20" />
                      <p className="text-lg font-medium">No rankings yet</p>
                      <p className="text-sm">Be the first to make predictions!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rankings.map((ranking, index) => (
                  <tr
                    key={ranking.user.email}
                    className={`transition-all duration-200 ${getRowBackground(index)} ${
                      index < 3 ? 'border-l-4 border-l-emerald-500' : ''
                    } hover:bg-emerald-100 dark:hover:bg-emerald-950`}
                  >
                    <td className="text-center font-semibold">
                      {getPlaceIcon(ranking.place)}
                    </td>
                    {showUserInfo && (
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                            index === 0
                              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                              : index === 1
                              ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700'
                              : index === 2
                              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                              : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                          }`}>
                            {ranking.user.name?.charAt(0)?.toUpperCase() || ranking.user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {ranking.user.name || 'Anonymous'}
                            </div>
                            {ranking.user.country && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="inline-block w-4 h-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded shadow-sm"></span>
                                {ranking.user.country}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-green-700">
                          {ranking.totalPoints}
                        </span>
                        {index < 3 && (
                          <Badge className={`mt-1 text-xs ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800 border-slate-400'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {ranking.totalGuesses}
                      </span>
                    </td>
                    <td className="text-right">
                      <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 text-sm">
                        {ranking.accurateGuesses}
                      </Badge>
                    </td>
                    <td className="text-right text-slate-600 dark:text-slate-400">
                      {ranking.groupStagePoints}
                    </td>
                    <td className="text-right text-slate-600 dark:text-slate-400">
                      {ranking.playoffPoints}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold ${getAccuracyColor(ranking.accurateGuesses, ranking.totalGuesses)}`}>
                          {getAccuracyPercentage(ranking.accurateGuesses, ranking.totalGuesses)}
                        </span>
                        <div className="w-16 progress-excel">
                          <div
                            className="progress-excel-bar"
                            style={{
                              width: `${Math.min(100, (ranking.totalGuesses > 0 ? (ranking.accurateGuesses / ranking.totalGuesses) * 100 : 0))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        {rankings.length > 0 && (
          <div className="px-6 py-4 bg-emerald-50/50 dark:bg-emerald-950/30 border-t border-emerald-200 dark:border-emerald-800">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Top 3 highlighted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">4 pts - Exact Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">2 pts - Winner + One Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">1 pt - Correct Winner</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
