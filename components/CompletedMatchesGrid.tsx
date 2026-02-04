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

interface CompletedMatchesGridProps {
  matches: Match[]
  isAuthenticated: boolean
}

export function CompletedMatchesGrid({ matches, isAuthenticated }: CompletedMatchesGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 30

  const totalPages = Math.ceil(matches.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMatches = matches.slice(startIndex, endIndex)

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedMatches.map((match) => (
          <MatchCardWrapper
            key={match.id}
            match={match as any}
            isAuthenticated={isAuthenticated}
          />
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
