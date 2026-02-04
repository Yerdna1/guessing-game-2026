import { prisma } from '@/lib/prisma'

// Official 2026 Winter Olympics Men's Ice Hockey Schedule
const matches = [
  // February 11, 2026
  { home: 'SVK', away: 'FIN', date: '2026-02-11', time: '16:40', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'SWE', away: 'ITA', date: '2026-02-11', time: '21:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },

  // February 12, 2026
  { home: 'SUI', away: 'FRA', date: '2026-02-12', time: '12:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'CZE', away: 'CAN', date: '2026-02-12', time: '16:40', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'LAT', away: 'USA', date: '2026-02-12', time: '21:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'GER', away: 'DEN', date: '2026-02-12', time: '21:10', venue: 'Milano Rho', stage: 'GROUP_STAGE' },

  // February 13, 2026
  { home: 'ITA', away: 'SVK', date: '2026-02-13', time: '12:10', venue: 'Milano Rho', stage: 'GROUP_STAGE' },
  { home: 'FIN', away: 'SWE', date: '2026-02-13', time: '12:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'FRA', away: 'CZE', date: '2026-02-13', time: '16:40', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'CAN', away: 'SUI', date: '2026-02-13', time: '21:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },

  // February 14, 2026
  { home: 'SWE', away: 'SVK', date: '2026-02-14', time: '12:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'GER', away: 'LAT', date: '2026-02-14', time: '12:10', venue: 'Milano Rho', stage: 'GROUP_STAGE' },
  { home: 'FIN', away: 'ITA', date: '2026-02-14', time: '16:40', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'USA', away: 'DEN', date: '2026-02-14', time: '21:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },

  // February 15, 2026
  { home: 'SUI', away: 'CZE', date: '2026-02-15', time: '12:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'CAN', away: 'FRA', date: '2026-02-15', time: '16:40', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
  { home: 'DEN', away: 'LAT', date: '2026-02-15', time: '19:10', venue: 'Milano Rho', stage: 'GROUP_STAGE' },
  { home: 'USA', away: 'GER', date: '2026-02-15', time: '21:10', venue: 'Milano Santagiulia', stage: 'GROUP_STAGE' },
]

async function updateMatchSchedule() {
  try {
    console.log('🏒 Updating 2026 Winter Olympics Men\'s Ice Hockey Schedule...\n')

    // Delete all existing guesses (foreign key constraint)
    const deletedGuesses = await prisma.guess.deleteMany({})
    console.log(`🗑️  Deleted ${deletedGuesses.count} existing guesses`)

    // Delete all existing matches
    const deletedMatches = await prisma.match.deleteMany({
      where: { tournamentId: 'default' }
    })
    console.log(`🗑️  Deleted ${deletedMatches.count} existing matches\n`)

    let matchNumber = 0

    for (const matchData of matches) {
      matchNumber++

      // Parse date and time
      const [year, month, day] = matchData.date.split('-').map(Number)
      const [hour, minute] = matchData.time.split(':').map(Number)

      // Create UTC date
      const scheduledTime = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

      // Find teams
      const homeTeam = await prisma.team.findUnique({
        where: { code: matchData.home }
      })

      const awayTeam = await prisma.team.findUnique({
        where: { code: matchData.away }
      })

      if (!homeTeam) {
        console.log(`❌ Home team not found: ${matchData.home}`)
        continue
      }

      if (!awayTeam) {
        console.log(`❌ Away team not found: ${matchData.away}`)
        continue
      }

      // Create match
      const match = await prisma.match.create({
        data: {
          tournamentId: 'default',
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          scheduledTime,
          venue: matchData.venue,
          stage: matchData.stage as any,
          status: 'SCHEDULED',
          isPlayoff: false,
          matchNumber
        }
      })

      console.log(`✅ Match ${matchNumber}: ${matchData.home} vs ${matchData.away} - ${matchData.date} ${matchData.time}`)
    }

    console.log(`\n🎉 Successfully created ${matches.length} matches`)

    // Show database totals
    const totalMatches = await prisma.match.count()

    console.log(`\n📊 Database totals:`)
    console.log(`   - Total matches: ${totalMatches}`)

  } catch (error) {
    console.error('❌ Error updating match schedule:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateMatchSchedule()
