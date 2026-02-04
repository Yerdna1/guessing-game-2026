import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Map Excel date format to proper dates
function parseExcelDate(dateStr: string, timeStr: string): Date {
  // Excel format: "11-Feb-2026", time: "16:40"
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  }

  // Parse date
  const [day, monthStr, year] = dateStr.split('-')
  const month = monthMap[monthStr] ?? 1 // Default to February if not found

  // Parse time
  const [hours, minutes] = timeStr.split(':').map(str => parseInt(str))

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

// Match stage based on column position
function getMatchStage(columnIndex: number): 'GROUP_STAGE' | 'QUARTERFINAL' | 'SEMIFINAL' | 'BRONZE_MATCH' | 'FINAL' {
  // For now, all matches in the Excel are GROUP_STAGE
  // You can update this logic when playoff matches are added
  return 'GROUP_STAGE'
}

async function syncFromExcel() {
  try {
    console.log('🔄 Starting Excel sync...')

    // Read Excel file
    const workbook = XLSX.readFile('/Volumes/DATA/Python/GUESS_RESULT_GAME/The_OG_2026_Guessing_Game.xlsx')
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
      console.log('✅ Created default tournament')
    }

    // Convert sheet to JSON for easier access
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][]

    // Extract match data from Excel structure
    const matches: Array<{
      home: string,
      away: string,
      date: string,
      time: string,
      columnIndex: number
    }> = []

    // Row indices (0-based)
    const dateRow = 0
    const timeRow = 1
    const homeTeamRow = 2
    const awayTeamRow = 4

    // Date positions based on the actual Excel
    const dateColumns = [10, 15, 24] // Columns K, P, Y
    const matchColumns = [
      // 11-Feb-2026 matches
      10, 12, // SVK-FIN, SWE-ITA
      // 12-Feb-2026 matches
      15, 17, 19, 21, // SUI-FRA, CZE-CAN, LAT-USA, GER-DEN
      // 13-Feb-2026 matches
      24, 26, 28 // FIN-SWE, ITA-SVK, FRA-CZE
    ]

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

    console.log(`📊 Found ${matches.length} matches in Excel`)

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
        console.log(`✅ Created team: ${code}`)
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
            stage: getMatchStage(matchData.columnIndex),
            venue: 'Milano/Cortina'
          }
        })
        console.log(`📝 Updated match: ${matchData.home} vs ${matchData.away}`)
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
              stage: getMatchStage(matchData.columnIndex),
              status: 'SCHEDULED',
              isPlayoff: false
            }
          })
          console.log(`✅ Created match: ${matchData.home} vs ${matchData.away}`)
        }
      }

      // Store match reference for guess syncing
      (matchData as any).matchId = match?.id
    }

    // Sync user guesses from Excel
    const userDataStartRow = 6 // Row 7 in Excel (0-indexed)
    let guessesUpdated = 0
    let guessesCreated = 0

    for (let row = userDataStartRow; row < jsonData.length; row++) {
      const email = jsonData[row]?.[2] // Column C

      if (email && email !== 'Mail') {
        const user = await prisma.user.findUnique({ where: { email: String(email) } })

        if (user) {
          // Check each match column for guesses
          for (let i = 0; i < matches.length; i++) {
            const matchData = matches[i] as any
            const col = matchData.columnIndex
            const guessValue = jsonData[row]?.[col]

            if (guessValue && matchData.matchId) {
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
                      guessesUpdated++
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
                    guessesCreated++
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log(`\n✅ Sync complete!`)
    console.log(`📊 Summary:`)
    console.log(`   - Matches synced: ${matches.length}`)
    console.log(`   - Guesses created: ${guessesCreated}`)
    console.log(`   - Guesses updated: ${guessesUpdated}`)

    // Show database totals
    const totalMatches = await prisma.match.count()
    const totalGuesses = await prisma.guess.count()
    const totalUsers = await prisma.user.count()

    console.log(`\n📈 Database totals:`)
    console.log(`   - Total matches: ${totalMatches}`)
    console.log(`   - Total guesses: ${totalGuesses}`)
    console.log(`   - Total users: ${totalUsers}`)

  } catch (error) {
    console.error('❌ Error syncing from Excel:', error)
  } finally {
    await prisma.$disconnect()
  }
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

syncFromExcel()