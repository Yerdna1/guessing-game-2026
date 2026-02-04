'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
import { CheckCircle2, Clock, MapPin } from 'lucide-react'
import { DeleteMatchButton } from '@/components/DeleteMatchButton'

interface Match {
  id: string
  matchNumber: number | null
  scheduledTime: Date
  homeScore: number | null
  awayScore: number | null
  status: string
  stage: string
  isPlayoff: boolean
  venue: string | null
  homeTeam: {
    code: string
    name: string
    flagUrl: string | null
  }
  awayTeam: {
    code: string
    name: string
    flagUrl: string | null
  }
}

interface AdminMatchesListProps {
  matches: Match[]
}

export function AdminMatchesList({ matches }: AdminMatchesListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 30

  const totalPages = Math.ceil(matches.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMatches = matches.slice(startIndex, endIndex)

  return (
    <>
      <div className="space-y-4">
        {paginatedMatches.map((match) => (
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
              <DeleteMatchButton
                matchId={match.id}
                matchNumber={match.matchNumber ?? 0}
                homeTeam={match.homeTeam.code}
                awayTeam={match.awayTeam.code}
              />
            </div>

            <form action="/api/admin/update-match" method="POST">
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
                  <CheckCircle2 className="h-4 w-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalItems={matches.length}
          />
        </div>
      )}
    </>
  )
}
