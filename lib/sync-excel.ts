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
  matchNumber: number
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

// Match stage based on date
function getMatchStage(dateStr: string, columnIndex: number, datePositions: { col: number; date: string }[]): 'GROUP_STAGE' | 'QUARTERFINAL' | 'SEMIFINAL' | 'BRONZE_MATCH' | 'FINAL' {
  try {
    const parts = dateStr.split('-')
    const day = parseInt(parts[0])
    const month = parts[1]

    if (month !== 'Feb' || day < 17) return 'GROUP_STAGE'
    if (day <= 18) return 'QUARTERFINAL'
    if (day === 20) return 'SEMIFINAL'
    if (day >= 21) {
      // Feb 21 has Bronze match and Final - distinguish by position
      const feb21Positions = datePositions.filter(d => d.date.startsWith('21-Feb'))
      if (feb21Positions.length >= 2 && columnIndex >= feb21Positions[feb21Positions.length - 1].col) {
        return 'FINAL'
      }
      return 'BRONZE_MATCH'
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

// Default initial password for imported users
const DEFAULT_INITIAL_PASSWORD = '123456'

// Extract user name from Excel row
function extractUserName(row: any[]): string {
  // Name is in column B (index 1)
  const name = row[1]
  return name && typeof name === 'string' ? name.trim() : 'Unknown User'
}

// Extract user country from Excel row
function extractUserCountry(row: any[]): string {
  // Country is in column D (index 3)
  const country = row[3]
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

    // Determine the maximum column to scan
    const maxCol = Math.max(
      jsonData[dateRow]?.length || 0,
      jsonData[homeTeamRow]?.length || 0,
      jsonData[awayTeamRow]?.length || 0,
      jsonData[timeRow]?.length || 0
    )

    // Dynamically detect all date column positions from the date row
    const datePositions: { col: number; date: string }[] = []
    for (let col = 10; col < maxCol; col++) {
      const val = jsonData[dateRow]?.[col]
      if (val && typeof val === 'string' && val.match(/\d+-\w+-\d+/)) {
        datePositions.push({ col, date: val.trim() })
      }
    }

    // Extract all match columns - scan the full range
    // Track the last seen time to handle merged time cells in Excel
    let lastSeenTime: string | null = null

    for (let col = 10; col < maxCol; col++) {
      // Update last seen time from the time row
      const timeVal = jsonData[timeRow]?.[col]
      if (timeVal && typeof timeVal === 'string' && /^\d{1,2}:\d{2}$/.test(timeVal.trim())) {
        lastSeenTime = timeVal.trim()
      }

      const homeTeam = jsonData[homeTeamRow]?.[col]
      const awayTeam = jsonData[awayTeamRow]?.[col]

      if (!homeTeam || !awayTeam) continue

      const homeStr = String(homeTeam).trim()
      const awayStr = String(awayTeam).trim()

      // Skip non-team columns (Points headers, empty, labels)
      if (!homeStr || !awayStr) continue
      if (homeStr === 'Points' || awayStr === 'Points') continue
      if (homeStr === 'Matches' || homeStr === 'Results:') continue

      // Use the time at this column, or inherit from the last seen time
      // (Excel merges time cells when multiple matches share a time slot)
      const matchTime = (timeVal && typeof timeVal === 'string' && /^\d{1,2}:\d{2}$/.test(timeVal.trim()))
        ? timeVal.trim()
        : lastSeenTime

      if (!matchTime) continue

      // Find the appropriate date from dynamically detected positions
      let date = '11-Feb-2026' // default
      for (let i = datePositions.length - 1; i >= 0; i--) {
        if (col >= datePositions[i].col) {
          date = datePositions[i].date
          break
        }
      }

      matches.push({
        home: homeStr,
        away: awayStr,
        date: date,
        time: matchTime,
        columnIndex: col,
        matchNumber: matches.length + 1
      })
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

    // Clean up stale TBD matches from previous imports (those without matchNumber)
    const tbdTeam = await prisma.team.findUnique({ where: { code: 'TBD' } })
    if (tbdTeam) {
      const staleTBDMatches = await prisma.match.findMany({
        where: {
          tournamentId: 'default',
          homeTeamId: tbdTeam.id,
          awayTeamId: tbdTeam.id,
          matchNumber: null
        },
        select: { id: true }
      })
      if (staleTBDMatches.length > 0) {
        const staleIds = staleTBDMatches.map((m: { id: string }) => m.id)
        await prisma.guess.deleteMany({
          where: { matchId: { in: staleIds } }
        })
        await prisma.match.deleteMany({
          where: { id: { in: staleIds } }
        })
      }
    }

    // Update or create matches
    for (const matchData of matches) {
      const scheduledTime = parseExcelDate(matchData.date, matchData.time)
      const stage = getMatchStage(matchData.date, matchData.columnIndex, datePositions)
      const isTBD = matchData.home === 'TBD' || matchData.away === 'TBD'

      // Find existing match:
      // - For known teams: match by team codes (unique pair per tournament)
      // - For TBD playoff matches: match by matchNumber (since all are TBD vs TBD)
      let match
      if (isTBD) {
        match = await prisma.match.findFirst({
          where: {
            tournamentId: 'default',
            matchNumber: matchData.matchNumber
          }
        })
      } else {
        match = await prisma.match.findFirst({
          where: {
            tournamentId: 'default',
            homeTeam: { code: matchData.home },
            awayTeam: { code: matchData.away }
          }
        })
      }

      if (match) {
        // Update existing match
        match = await prisma.match.update({
          where: { id: match.id },
          data: {
            scheduledTime,
            stage,
            venue: 'Milano/Cortina',
            matchNumber: matchData.matchNumber
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
              stage,
              status: 'SCHEDULED',
              isPlayoff: stage !== 'GROUP_STAGE',
              matchNumber: matchData.matchNumber
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
    // Column structure: A=ID, B=Name, C=Email, D=Country, E=Filled, F-I=Stats, J+=Predictions

    for (let row = userDataStartRow; row < jsonData.length; row++) {
      const email = jsonData[row]?.[2] // Column C (index 2)

      if (email && email !== 'Mail' && typeof email === 'string') {
        const trimmedEmail = email.trim()

        // Create or update user
        let user = await prisma.user.findUnique({ where: { email: trimmedEmail } })

        if (!user) {
          // Create new user with default initial password (123456)
          const hashedPassword = await bcrypt.hash(DEFAULT_INITIAL_PASSWORD, 10)

          user = await prisma.user.create({
            data: {
              email: trimmedEmail,
              name: extractUserName(jsonData[row]),
              country: extractUserCountry(jsonData[row]),
              passwordHash: hashedPassword,
              emailVerified: new Date(),
              role: 'USER'
            }
          })
          result.usersCreated++
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
