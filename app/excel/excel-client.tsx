'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  matchNumber?: number | null
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
  guesses: Map<string, Guess>
}

interface EditingCell {
  userId: string
  matchId: string
  homeScore: string
  awayScore: string
}

export default function ExcelClient() {
  const [data, setData] = useState<ExcelGridData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCells, setEditingCells] = useState<Map<string, EditingCell>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    teamsCreated: number
    matchesCreated: number
    matchesUpdated: number
    usersCreated: number
    usersUpdated: number
    guessesCreated: number
    guessesUpdated: number
    error?: string
  } | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/excel')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      const guessesMap = new Map<string, Guess>()
      if (Array.isArray(result.guesses)) {
        result.guesses.forEach((guess: Guess) => {
          guessesMap.set(`${guess.userId}_${guess.matchId}`, guess)
        })
      }

      setData({
        users: result.users || [],
        matches: result.matches || [],
        guesses: guessesMap
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data: ' + (error instanceof Error ? error.message : 'Unknown error')
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveGuess = async (userId: string, matchId: string, homeScore: number, awayScore: number) => {
    try {
      const response = await fetch('/api/excel/save-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, matchId, homeScore, awayScore }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      // Update local state
      const key = `${userId}_${matchId}`
      const newGuess: Guess = {
        userId,
        matchId,
        homeScore,
        awayScore,
        points: result.guess?.points
      }

      setData(prev => {
        if (!prev) return prev
        const newGuesses = new Map(prev.guesses)
        newGuesses.set(key, newGuess)
        return { ...prev, guesses: newGuesses }
      })

      // Clear editing state for this cell
      setEditingCells(prev => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })

      // Show success feedback
      toast({
        title: 'Success',
        description: 'Guess saved successfully'
      })

      return true
    } catch (error) {
      console.error('Error saving guess:', error)
      toast({
        title: 'Error',
        description: 'Failed to save guess: ' + (error instanceof Error ? error.message : 'Unknown error')
      })
      return false
    }
  }

  const handleCellChange = (userId: string, matchId: string, field: 'homeScore' | 'awayScore', value: string) => {
    const key = `${userId}_${matchId}`

    const existingGuess = data?.guesses.get(key)
    const currentEditing = editingCells.get(key)

    const homeScore = field === 'homeScore' ? value : (currentEditing?.homeScore ?? existingGuess?.homeScore.toString() ?? '')
    const awayScore = field === 'awayScore' ? value : (currentEditing?.awayScore ?? existingGuess?.awayScore.toString() ?? '')

    setEditingCells(prev => {
      const newMap = new Map(prev)
      newMap.set(key, { userId, matchId, homeScore, awayScore })
      return newMap
    })
  }

  const handleBlur = async (userId: string, matchId: string) => {
    const key = `${userId}_${matchId}`
    const editing = editingCells.get(key)

    if (!editing) return

    const homeScore = parseInt(editing.homeScore)
    const awayScore = parseInt(editing.awayScore)

    // Only save if both values are valid numbers
    if (!isNaN(homeScore) && !isNaN(awayScore) && editing.homeScore.trim() !== '' && editing.awayScore.trim() !== '') {
      setSaving(true)
      await saveGuess(userId, matchId, homeScore, awayScore)
      setSaving(false)
    } else {
      // Clear editing state if invalid
      setEditingCells(prev => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, userId: string, matchId: string) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/excel/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadResult({
          success: true,
          teamsCreated: result.data.teamsCreated,
          matchesCreated: result.data.matchesCreated,
          matchesUpdated: result.data.matchesUpdated,
          usersCreated: result.data.usersCreated,
          usersUpdated: result.data.usersUpdated,
          guessesCreated: result.data.guessesCreated,
          guessesUpdated: result.data.guessesUpdated
        })

        toast({
          title: 'Import successful!',
          description: `Data imported successfully. Refreshing...`
        })

        // Refresh data after a short delay to allow database to update
        setTimeout(() => {
          fetchData()
        }, 500)
      } else {
        setUploadResult({
          success: false,
          teamsCreated: 0,
          matchesCreated: 0,
          matchesUpdated: 0,
          usersCreated: 0,
          usersUpdated: 0,
          guessesCreated: 0,
          guessesUpdated: 0,
          error: result.error
        })

        toast({
          title: 'Import failed',
          description: result.error || 'An error occurred'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setUploadResult({
        success: false,
        teamsCreated: 0,
        matchesCreated: 0,
        matchesUpdated: 0,
        usersCreated: 0,
        usersUpdated: 0,
        guessesCreated: 0,
        guessesUpdated: 0,
        error: errorMessage
      })

      toast({
        title: 'Import failed',
        description: errorMessage
      })
    } finally {
      setIsUploading(false)
      // Clear file input
      e.target.value = ''
    }
  }

  // Group matches exactly as they appear in Excel
  const getExcelMatchColumns = () => {
    if (!data) return []

    // Return ALL matches from the database with proper grouping
    const matchColumns: (Match & { columnGroup: number; pairIndex: number })[] = []

    data.matches.forEach((match, index) => {
      matchColumns.push({
        ...match,
        columnGroup: Math.floor(index / 2) + 1, // Group by pairs for dates
        pairIndex: index % 2
      })
    })

    return matchColumns
  }

  const getDates = () => {
    if (!data) return []
    // Group matches by date and return unique dates with their counts
    const matchColumns = getExcelMatchColumns()
    const dateGroups = new Map<string, number>()

    matchColumns.forEach(match => {
      const date = new Date(match.scheduledTime)
      const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
      dateGroups.set(dateStr, (dateGroups.get(dateStr) || 0) + 1)
    })

    return Array.from(dateGroups.entries())
  }

  const getTimes = () => {
    if (!data) return []
    // Generate times dynamically from match times
    const matchColumns = getExcelMatchColumns()
    return matchColumns.map(match => {
      const date = new Date(match.scheduledTime)
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    })
  }

  // Helper function to get cell background color based on points
  const getPointsColor = (points: number | undefined) => {
    if (points === undefined || points === 0) return 'bg-blue-50 dark:bg-blue-900/20'
    if (points === 1) return 'bg-orange-100 dark:bg-orange-900/30'
    if (points === 2) return 'bg-blue-100 dark:bg-blue-900/30'
    if (points >= 4) return 'bg-green-100 dark:bg-green-900/30'
    return 'bg-blue-50 dark:bg-blue-900/20'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-full mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Excel data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-full mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">IBM & OLYMPIC GAMES 2026 Guessing Game</h1>
          <div className="text-center py-12">No data available</div>
        </div>
      </div>
    )
  }

  const matchColumns = getExcelMatchColumns()
  const dates = getDates()
  const times = getTimes()

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-full mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            IBM & OLYMPIC GAMES 2026 Guessing Game
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Click on any prediction cell to edit. Press Enter or click away to save.
          </p>
          {saving && (
            <div className="mt-2 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Saving changes...</span>
            </div>
          )}
        </div>

        {/* Rules Section */}
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
            <strong>Rules:</strong> Guess just final score, so no draws can happen!!!.
            If you guess exact score of match: <strong>4pts</strong>, if you guess the winner of match and number of goals scored by home or away team: <strong>2pts</strong>,
            if you guess just the winner: <strong>1pts</strong>. In PLAY OFF you receive <strong>+1 point</strong> for each mentioned scenario.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  Import from Excel
                </h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Upload an Excel file to update matches, teams, users, and predictions. New users will be created automatically with temporary passwords.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  asChild
                >
                  <span className="cursor-pointer flex items-center gap-2">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Choose Excel File
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Results Display */}
          {uploadResult && uploadResult.success && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">✅ Import Successful</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-green-700 dark:text-green-300">
                    <div><span className="font-semibold">Teams created:</span> {uploadResult.teamsCreated}</div>
                    <div><span className="font-semibold">Matches created:</span> {uploadResult.matchesCreated}</div>
                    <div><span className="font-semibold">Matches updated:</span> {uploadResult.matchesUpdated}</div>
                    <div><span className="font-semibold">Users created:</span> {uploadResult.usersCreated}</div>
                    <div><span className="font-semibold">Users updated:</span> {uploadResult.usersUpdated}</div>
                    <div><span className="font-semibold">Guesses created:</span> {uploadResult.guessesCreated}</div>
                    <div><span className="font-semibold">Guesses updated:</span> {uploadResult.guessesUpdated}</div>
                  </div>
                  {uploadResult.usersCreated > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ {uploadResult.usersCreated} new user(s) created with temporary passwords. Check server logs for passwords.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {uploadResult && !uploadResult.success && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-100 mb-1">❌ Import Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{uploadResult.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Excel-style Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-x-auto border-2 border-emerald-200 dark:border-emerald-700">
          <table className="w-full border-collapse" style={{ fontSize: '11px', tableLayout: 'auto', minWidth: '4000px' }}>
            <thead>
              {/* Row 0: Title Row */}
              <tr>
                <th colSpan={9} className="border-2 border-emerald-600 dark:border-emerald-500 bg-emerald-600 text-white text-left p-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  IBM & OLYMPIC GAMES 2026 Guessing Game
                </th>
                {dates.map(([date, count], idx) => (
                  <th key={`date-${idx}`} colSpan={count * 2} className="border-2 border-emerald-600 dark:border-emerald-500 bg-emerald-600 text-white text-center p-1">
                    {date}
                  </th>
                ))}
              </tr>

              {/* Row 1: Time Row */}
              <tr>
                <th colSpan={9} className="border border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 text-left p-1" style={{ fontSize: '11px', fontWeight: '600' }}>
                  Game Date
                </th>
                {times.map((time, idx) => (
                  <th key={idx} className="border border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 text-center p-1" style={{ fontSize: '11px', minWidth: '50px' }}>
                    {time}
                  </th>
                ))}
              </tr>

              {/* Row 2: Match Numbers Row */}
              <tr>
                <th colSpan={9} className="border border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 text-left p-2" style={{ fontSize: '11px', fontWeight: '600' }}>
                  Match #
                </th>
                {matchColumns.map((match, idx) => (
                  <th key={match.id} className="border border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 text-center p-1" style={{ fontSize: '11px', minWidth: '150px', width: '150px' }}>
                    #{match.matchNumber}
                  </th>
                ))}
              </tr>

              {/* Row 3: Matches Row */}
              <tr>
                <th colSpan={9} className="border border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 text-left p-2" style={{ fontSize: '11px', fontWeight: '600' }}>
                  Matches
                </th>
                {matchColumns.map((match, idx) => (
                  <th key={match.id} className="border border-emerald-400 dark:border-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 text-center p-1" style={{ minWidth: '150px', width: '150px' }}>
                    <div className="flex flex-col items-center gap-1">
                      {match.homeTeam.flagUrl && (
                        <div className="relative w-8 h-5 rounded overflow-hidden shadow-sm border border-emerald-300 dark:border-emerald-700">
                          <Image
                            src={match.homeTeam.flagUrl}
                            alt={match.homeTeam.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <span className="font-bold">{match.homeTeam.code}</span>
                    </div>
                  </th>
                ))}
              </tr>

              {/* Row 4: vs Row */}
              <tr>
                <th colSpan={9} className="border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-800 p-1"></th>
                {matchColumns.map((_, idx) => (
                  <th key={idx} className="border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-center p-1" style={{ fontSize: '10px', fontStyle: 'italic' }}>
                    vs
                  </th>
                ))}
              </tr>

              {/* Row 5: Opposing Teams */}
              <tr>
                <th colSpan={9} className="border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-800 p-1"></th>
                {matchColumns.map((match, idx) => (
                  <th key={match.id} className="border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-center p-1" style={{ fontSize: '11px', fontWeight: '600' }}>
                    <div className="flex flex-col items-center gap-1">
                      {match.awayTeam.flagUrl && (
                        <div className="relative w-8 h-5 rounded overflow-hidden shadow-sm border border-blue-300 dark:border-blue-700">
                          <Image
                            src={match.awayTeam.flagUrl}
                            alt={match.awayTeam.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <span className="font-bold">{match.awayTeam.code}</span>
                    </div>
                  </th>
                ))}
              </tr>

              {/* Row 5: Header Row for User Data */}
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-center font-bold" style={{ width: '40px' }}>
                  ID
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-left font-bold" style={{ width: '150px' }}>
                  Name
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-left font-bold" style={{ width: '200px' }}>
                  Mail
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-center font-bold" style={{ width: '100px' }}>
                  Country
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-center font-bold" style={{ width: '80px' }}>
                  Filled matches
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-center font-bold" style={{ width: '80px' }}>
                  Accurate guesses
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-center font-bold" style={{ width: '100px' }}>
                  Group-stage Points
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-center font-bold" style={{ width: '100px' }}>
                  Play-off Points
                </th>
                <th className="border-2 border-emerald-400 dark:border-emerald-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 text-center font-bold" style={{ width: '80px' }}>
                  Total Points
                </th>
                <th colSpan={matchColumns.length} className="border-2 border-emerald-400 dark:border-emerald-600 bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 p-2 text-center font-bold" style={{ fontSize: '12px' }}>
                  Results:
                </th>
              </tr>
            </thead>

            <tbody>
              {data.users.map((user, userIndex) => {
                const filledMatches = data.matches.filter(m =>
                  data.guesses.has(`${user.id}_${m.id}`)
                ).length

                return (
                  <tr key={user.id} className={userIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                    {/* Fixed Columns */}
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-center text-gray-900 dark:text-gray-100 font-mono">
                      {userIndex + 1}
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-gray-900 dark:text-gray-100 font-medium">
                      {user.name}
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-gray-600 dark:text-gray-400 text-xs">
                      {user.email}
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-center text-gray-900 dark:text-gray-100">
                      {user.country}
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-center text-gray-900 dark:text-gray-100">
                      {filledMatches}
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-center text-gray-900 dark:text-gray-100">
                      0
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-center text-gray-900 dark:text-gray-100">
                      0
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-center text-gray-900 dark:text-gray-100">
                      0
                    </td>
                    <td className="border border-emerald-300 dark:border-emerald-700 p-2 text-center font-bold text-gray-900 dark:text-gray-100">
                      0
                    </td>

                    {/* Match Predictions and Points */}
                    {matchColumns.map((match, idx) => {
                      const key = `${user.id}_${match.id}`
                      const guess = data.guesses.get(key)
                      const editing = editingCells.get(key)

                      const displayHome = editing?.homeScore ?? guess?.homeScore.toString() ?? ''
                      const displayAway = editing?.awayScore ?? guess?.awayScore.toString() ?? ''
                      const isEditing = editing !== undefined

                      return (
                        <td key={match.id} className={`border border-emerald-300 dark:border-emerald-700 p-2 text-center ${isEditing ? 'bg-yellow-50 dark:bg-yellow-900/20' : getPointsColor(guess?.points)}`} style={{ minWidth: '150px', width: '150px', whiteSpace: 'nowrap' }}>
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-14 text-center font-mono font-bold text-blue-700 dark:text-blue-300 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              value={displayHome}
                              onChange={(e) => handleCellChange(user.id, match.id, 'homeScore', e.target.value)}
                              onBlur={() => handleBlur(user.id, match.id)}
                              onKeyDown={(e) => handleKeyDown(e, user.id, match.id)}
                              placeholder="-"
                            />
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">:</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-14 text-center font-mono font-bold text-blue-700 dark:text-blue-300 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              value={displayAway}
                              onChange={(e) => handleCellChange(user.id, match.id, 'awayScore', e.target.value)}
                              onBlur={() => handleBlur(user.id, match.id)}
                              onKeyDown={(e) => handleKeyDown(e, user.id, match.id)}
                              placeholder="-"
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Users</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.users.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Matches</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.matches.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Guesses</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.guesses.size}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Fill Rate</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round((data.guesses.size / (data.users.length * data.matches.length)) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">Points Legend:</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></span>
              <span>4 pts - Exact score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded"></span>
              <span>2 pts - Winner + one team score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded"></span>
              <span>1 pt - Correct winner only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded"></span>
              <span>0 pts - No points / No prediction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}