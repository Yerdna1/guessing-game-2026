import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'

export interface SyncResult {
  success: boolean
  teamsCreated: number
  matchesCreated: number
  matchesUpdated: number
  usersCreated: number
  usersUpdated: number
  guessesCreated: number
  guessesUpdated: number
  errors?: string[]
}

interface MatchData {
  home: string
  away: string
  date: string
  time: string
  columnIndex: number
  matchId?: string
}

// Map Excel date format to proper dates
function parseExcelDate(dateStr: string, timeStr: string): Date {
  // Excel format: "11-Feb-2026", time: "16:40"
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  }

  // Parse date
  const parts = dateStr.split('-')
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  const [day, monthStr, year] = parts
  const month = monthMap[monthStr] ?? 1

  // Parse time
  const timeParts = timeStr.split(':')
  if (timeParts.length !== 2) {
    throw new Error(`Invalid time format: ${timeStr}`)
  }

  const [hours, minutes] = timeParts.map(str => parseInt(str))

  // Create date in UTC
  const date = new Date(Date.UTC(
    parseInt(year),
    month,
    parseInt(day),
    hours,
    minutes,
    0
  ))

  return date
}

// Match stage based on column position and date
function getMatchStage(columnIndex: number, dateStr: string): 'GROUP_STAGE' | 'QUARTERFINAL' | 'SEMIFINAL' | 'BRONZE_MATCH' | 'FINAL' {
  // Detect playoff matches based on date or position
  // February 20+ = playoffs
  try {
    const matchDate = parseExcelDate(dateStr, '00:00')
    if (matchDate >= new Date('2026-02-20')) {
      // Determine specific stage based on column position
      if (columnIndex >= 35) return 'FINAL'
      if (columnIndex >= 30) return 'BRONZE_MATCH'
      if (columnIndex >= 25) return 'SEMIFINAL'
      return 'QUARTERFINAL'
    }
  } catch {
    // If date parsing fails, default to group stage
  }
  return 'GROUP_STAGE'
}

// Helper function to get full team names
function getTeamName(code: string): string {
  const teamNames: Record<string, string> = {
    'SVK': 'Slovakia',
    'SWE': 'Sweden',
    'FIN': 'Finland',
    'ITA': 'Italy',
    'SUI': 'Switzerland',
    'FRA': 'France',
    'CZE': 'Czech Republic',
    'CAN': 'Canada',
    'LAT': 'Latvia',
    'USA': 'United States',
    'GER': 'Germany',
    'DEN': 'Denmark'
  }
  return teamNames[code] || code
}

// Generate a temporary password for new users
function generateTempPassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
}

// Extract user name from Excel row
function extractUserName(row: any[]): string {
  // Name is in column D (index 3)
  const name = row[3]
  return name && typeof name === 'string' ? name.trim() : 'Unknown User'
}

// Extract user country from Excel row
function extractUserCountry(row: any[]): string {
  // Country is in column E (index 4)
  const country = row[4]
  return country && typeof country === 'string' ? country.trim() : ''
}

export async function syncExcelData(buffer: ArrayBuffer): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    teamsCreated: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    usersCreated: 0,
    usersUpdated: 0,
    guessesCreated: 0,
    guessesUpdated: 0,
    errors: []
  }

  try {
    // Parse Excel from buffer
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Ensure default tournament exists
    let tournament = await prisma.tournament.findUnique({
      where: { id: 'default' }
    })

    if (!tournament) {
      tournament = await prisma.tournament.create({
        data: {
          id: 'default',
          name: 'IBM & Olympic Games 2026',
          description: 'Ice Hockey Tournament',
          location: 'Milano/Cortina',
          startDate: new Date('2026-02-11'),
          endDate: new Date('2026-02-23'),
          status: 'UPCOMING'
        }
      })
    }

    // Convert sheet to JSON for easier access
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][]

    // Extract match data from Excel structure
    const matches: MatchData[] = []

    // Row indices (0-based)
    const dateRow = 0
    const timeRow = 1
    const homeTeamRow = 2
    const awayTeamRow = 4

    // Date positions based on the actual Excel
    const dateColumns = [10, 15, 24]

    // Extract all match columns systematically
    for (let col = 10; col < 40; col++) {
      const homeTeam = jsonData[homeTeamRow]?.[col]
      const awayTeam = jsonData[awayTeamRow]?.[col]
      const time = jsonData[timeRow]?.[col]

      if (homeTeam && awayTeam && time && homeTeam !== 'Points' && awayTeam !== 'Points') {
        // Find the appropriate date
        let date = '11-Feb-2026' // default
        for (let i = dateColumns.length - 1; i >= 0; i--) {
          if (col >= dateColumns[i] && jsonData[dateRow]?.[dateColumns[i]]) {
            date = jsonData[dateRow][dateColumns[i]]
            break
          }
        }

        matches.push({
          home: homeTeam,
          away: awayTeam,
          date: date,
          time: time,
          columnIndex: col
        })
      }
    }

    // Ensure all teams exist
    const teamCodes = new Set<string>()
    matches.forEach(m => {
      teamCodes.add(m.home)
      teamCodes.add(m.away)
    })

    for (const code of teamCodes) {
      const existingTeam = await prisma.team.findUnique({
        where: { code }
      })

      if (!existingTeam) {
        await prisma.team.create({
          data: {
            code,
            name: getTeamName(code),
            flagUrl: `/flags/${code.toLowerCase()}.svg`
          }
        })
        result.teamsCreated++
      }
    }

    // Update or create matches
    for (const matchData of matches) {
      const scheduledTime = parseExcelDate(matchData.date, matchData.time)

      // Find existing match by teams and tournament
      let match = await prisma.match.findFirst({
        where: {
          tournamentId: 'default',
          homeTeam: { code: matchData.home },
          awayTeam: { code: matchData.away }
        }
      })

      if (match) {
        // Update existing match
        match = await prisma.match.update({
          where: { id: match.id },
          data: {
            scheduledTime,
            stage: getMatchStage(matchData.columnIndex, matchData.date),
            venue: 'Milano/Cortina'
          }
        })
        result.matchesUpdated++
      } else {
        // Create new match
        const homeTeam = await prisma.team.findUnique({ where: { code: matchData.home } })
        const awayTeam = await prisma.team.findUnique({ where: { code: matchData.away } })

        if (homeTeam && awayTeam) {
          match = await prisma.match.create({
            data: {
              tournamentId: 'default',
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              scheduledTime,
              venue: 'Milano/Cortina',
              stage: getMatchStage(matchData.columnIndex, matchData.date),
              status: 'SCHEDULED',
              isPlayoff: getMatchStage(matchData.columnIndex, matchData.date) !== 'GROUP_STAGE'
            }
          })
          result.matchesCreated++
        }
      }

      // Store match reference for guess syncing
      matchData.matchId = match?.id
    }

    // Sync user data and guesses from Excel
    const userDataStartRow = 6 // Row 7 in Excel (0-indexed)

    for (let row = userDataStartRow; row < jsonData.length; row++) {
      const email = jsonData[row]?.[2] // Column C

      if (email && email !== 'Mail' && typeof email === 'string') {
        const trimmedEmail = email.trim()

        // Create or update user
        let user = await prisma.user.findUnique({ where: { email: trimmedEmail } })

        if (!user) {
          // Create new user with temporary password
          const tempPassword = generateTempPassword()
          const hashedPassword = await bcrypt.hash(tempPassword, 10)

          user = await prisma.user.create({
            data: {
              email: trimmedEmail,
              name: extractUserName(jsonData[row]),
              country: extractUserCountry(jsonData[row]),
              passwordHash: hashedPassword,
              role: 'USER'
            }
          })
          result.usersCreated++
          result.errors?.push(`Created user ${trimmedEmail} with temporary password: ${tempPassword}`)
        } else {
          // Update existing user's name/country if changed
          const newName = extractUserName(jsonData[row])
          const newCountry = extractUserCountry(jsonData[row])

          if (user.name !== newName || user.country !== newCountry) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: newName,
                country: newCountry
              }
            })
            result.usersUpdated++
          }
        }

        // Sync guesses for this user
        for (const matchData of matches) {
          const col = matchData.columnIndex
          const guessValue = jsonData[row]?.[col]

          if (guessValue && matchData.matchId && user) {
            const scoreParts = String(guessValue).split(':')

            if (scoreParts.length === 2) {
              const homeScore = parseInt(scoreParts[0].trim())
              const awayScore = parseInt(scoreParts[1].trim())

              if (!isNaN(homeScore) && !isNaN(awayScore)) {
                // Check if guess exists
                const existingGuess = await prisma.guess.findUnique({
                  where: {
                    userId_matchId: {
                      userId: user.id,
                      matchId: matchData.matchId
                    }
                  }
                })

                if (existingGuess) {
                  // Update if different
                  if (existingGuess.homeScore !== homeScore || existingGuess.awayScore !== awayScore) {
                    await prisma.guess.update({
                      where: { id: existingGuess.id },
                      data: { homeScore, awayScore }
                    })
                    result.guessesUpdated++
                  }
                } else {
                  // Create new guess
                  await prisma.guess.create({
                    data: {
                      userId: user.id,
                      matchId: matchData.matchId,
                      homeScore,
                      awayScore
                    }
                  })
                  result.guessesCreated++
                }
              }
            }
          }
        }
      }
    }

    result.success = true

  } catch (error) {
    console.error('❌ Error syncing from Excel:', error)
    result.success = false
    result.errors?.push(error instanceof Error ? error.message : String(error))
  }

  return result
}
