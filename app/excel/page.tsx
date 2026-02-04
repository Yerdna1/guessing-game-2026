'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Team {
  id: string
  code: string
  name: string
  flagUrl: string
}

interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  scheduledTime: Date
  venue: string
  stage: string
  isPlayoff: boolean
}

interface User {
  id: string
  name: string
  email: string
  country: string
}

interface Guess {
  userId: string
  matchId: string
  homeScore: number
  awayScore: number
  points?: number
}

interface ExcelGridData {
  users: User[]
  matches: Match[]
  guesses: Map<string, Guess> // key: userId_matchId
}

export default function ExcelViewPage() {
  const [data, setData] = useState<ExcelGridData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch users
        const usersRes = await fetch('/api/users')
        const usersData = await usersRes.json()

        // Fetch matches
        const matchesRes = await fetch('/api/matches')
        const matchesData = await matchesRes.json()

        // Fetch guesses
        const guessesRes = await fetch('/api/guesses')
        const guessesData = await guessesRes.json()

        // Create a map for quick lookup
        const guessesMap = new Map<string, Guess>()
        guessesData.forEach((guess: Guess) => {
          guessesMap.set(`${guess.userId}_${guess.matchId}`, guess)
        })

        setData({
          users: usersData,
          matches: matchesData,
          guesses: guessesMap
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load data'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Group matches by date
  const matchesByDate = data ? data.matches.reduce((acc, match) => {
    const date = new Date(match.scheduledTime).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(match)
    return acc
  }, {} as Record<string, Match[]>) : {}

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">IBM & Olympic Games 2026 - Guessing Game</h1>
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">IBM & Olympic Games 2026 - Guessing Game</h1>
          <div className="text-center py-12">No data available</div>
        </div>
      </div>
    )
  }

  const sortedDates = Object.keys(matchesByDate).sort((a, b) =>
    new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime()
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-full mx-auto overflow-x-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">IBM & OLYMPIC GAMES 2026 Guessing Game</h1>
          <p className="text-gray-600 dark:text-gray-400">Excel-style view of all predictions</p>
        </div>

        {/* Excel-style table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                {/* Fixed columns */}
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-center bg-blue-800 min-w-[60px]">
                  ID
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-left bg-blue-800 min-w-[150px]">
                  Name
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-center bg-blue-800 min-w-[100px]">
                  Country
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-center bg-blue-800 min-w-[80px]">
                  Filled
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-center bg-blue-800 min-w-[80px]">
                  Accurate
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-center bg-blue-800 min-w-[80px]">
                  Group Pts
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-center bg-blue-800 min-w-[80px]">
                  Playoff Pts
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs font-bold text-center bg-blue-800 min-w-[80px]">
                  Total Pts
                </th>

                {/* Match columns grouped by date */}
                {sortedDates.map((date) => (
                  <th key={date} colSpan={matchesByDate[date].length} className="border border-gray-300 dark:border-gray-600 p-1 bg-blue-900 text-center">
                    <div className="text-xs font-semibold">{date}</div>
                  </th>
                ))}
              </tr>
              <tr className="bg-blue-700">
                {/* Empty headers for fixed columns */}
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>
                <th className="border border-gray-300 dark:border-gray-600 p-0 bg-blue-800"></th>

                {/* Match headers with team codes */}
                {sortedDates.map((date) =>
                  matchesByDate[date].map((match) => (
                    <th key={match.id} className="border border-gray-300 dark:border-gray-600 p-1 text-center min-w-[120px]">
                      <div className="text-xs font-medium">
                        {match.homeTeam.code}
                      </div>
                      <div className="text-xs text-blue-200">vs</div>
                      <div className="text-xs font-medium">
                        {match.awayTeam.code}
                      </div>
                      <div className="text-xs text-blue-300 mt-1">
                        {new Date(match.scheduledTime).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {data.users.map((user, index) => {
                const userGuesses = data.matches.filter(m =>
                  data.guesses.has(`${user.id}_${m.id}`)
                )
                const filledCount = userGuesses.length

                return (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                    {/* Fixed columns */}
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-center text-xs">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-xs font-medium">
                      {user.name}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-xs text-center">
                      {user.country}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-center text-xs">
                      {filledCount}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-center text-xs">
                      0
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-center text-xs">
                      0
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-center text-xs">
                      0
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 p-2 text-center text-xs font-bold">
                      0
                    </td>

                    {/* Guess cells */}
                    {sortedDates.map((date) =>
                      matchesByDate[date].map((match) => {
                        const guess = data.guesses.get(`${user.id}_${match.id}`)
                        return (
                          <td key={match.id} className="border border-gray-300 dark:border-gray-700 p-1 text-center">
                            {guess ? (
                              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                {guess.homeScore}:{guess.awayScore}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">-</div>
                            )}
                          </td>
                        )
                      })
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2 text-sm">Legend:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded"></div>
              <span>User Guess</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-gray-300 rounded"></div>
              <span>No Guess</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Users</div>
            <div className="text-2xl font-bold">{data.users.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Matches</div>
            <div className="text-2xl font-bold">{data.matches.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Guesses</div>
            <div className="text-2xl font-bold">{data.guesses.size}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Participation</div>
            <div className="text-2xl font-bold">
              {Math.round((data.guesses.size / (data.users.length * data.matches.length)) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
