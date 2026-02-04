'use client'

import { useState } from 'react'
import { MatchCardWrapper } from '@/components/MatchCardWrapper'
import { Pagination } from '@/components/ui/pagination'

export interface Match {
  id: string
  scheduledTime: Date
  homeTeam: { code: string; name: string; flagUrl?: string | null }
  awayTeam: { code: string; name: string; flagUrl?: string | null }
  status: string
  homeScore: number | null
  awayScore: number | null
  stage: string
  venue: string | null
  isPlayoff: boolean | null
  matchNumber: number | null
  userGuess?: {
    homeScore: number
    awayScore: number
    points: number | null
  } | null
}

interface MatchesByDateProps {
  matches: Match[]
  isAuthenticated: boolean
}

export function MatchesByDate({ matches, isAuthenticated }: MatchesByDateProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 30

  const totalPages = Math.ceil(matches.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMatches = matches.slice(startIndex, endIndex)

  // Group paginated matches by date
  const matchesByDate = paginatedMatches.reduce((acc, match) => {
    const dateStr = new Date(match.scheduledTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!acc[dateStr]) {
      acc[dateStr] = []
    }
    acc[dateStr].push(match)
    return acc
  }, {} as Record<string, typeof paginatedMatches>)

  return (
    <>
      {/* Display matches grouped by date */}
      {Object.entries(matchesByDate).map(([date, dateMatches], index) => (
        <div key={date} className={index > 0 ? 'mt-12' : 'mb-12'}>
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">{date}</h2>

          {/* Live matches for this date */}
          {dateMatches.some(m => m.status === 'LIVE') && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Live Now
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateMatches.filter(m => m.status === 'LIVE').map((match) => (
                  <MatchCardWrapper
                    key={match.id}
                    match={match as any}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled matches for this date */}
          {dateMatches.some(m => m.status === 'SCHEDULED') && (
            <div className="mb-6">
              {dateMatches.some(m => m.status === 'LIVE') && (
                <h3 className="text-lg font-semibold mb-3">Upcoming Today</h3>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateMatches.filter(m => m.status === 'SCHEDULED').map((match) => (
                  <MatchCardWrapper
                    key={match.id}
                    match={match as any}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed matches for this date */}
          {dateMatches.some(m => m.status === 'COMPLETED') && (
            <div>
              {(dateMatches.some(m => m.status === 'LIVE') || dateMatches.some(m => m.status === 'SCHEDULED')) && (
                <h3 className="text-lg font-semibold mb-3">Completed</h3>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateMatches.filter(m => m.status === 'COMPLETED').map((match) => (
                  <MatchCardWrapper
                    key={match.id}
                    match={match as any}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

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

      {matches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No matches found
        </div>
      )}
    </>
  )
}
