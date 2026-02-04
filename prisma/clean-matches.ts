import { prisma } from '../lib/prisma'

async function cleanMatches() {
  // Real matches from Excel
  const realMatches = [
    { home: 'SVK', away: 'FIN' },
    { home: 'SWE', away: 'ITA' },
    { home: 'SUI', away: 'FRA' },
    { home: 'CZE', away: 'CAN' },
    { home: 'LAT', away: 'USA' },
    { home: 'GER', away: 'DEN' },
    { home: 'FIN', away: 'SWE' },
    { home: 'ITA', away: 'SVK' },
    { home: 'FRA', away: 'CZE' },
    { home: 'CAN', away: 'SUI' },
    { home: 'SWE', away: 'SVK' },
    { home: 'GER', away: 'LAT' },
    { home: 'FIN', away: 'ITA' },
    { home: 'USA', away: 'DEN' },
    { home: 'SUI', away: 'CZE' },
    { home: 'CAN', away: 'FRA' },
    { home: 'DEN', away: 'LAT' },
    { home: 'USA', away: 'GER' },
  ]

  try {
    // First, let's see what matches we have
    const allMatches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    })

    console.log(`Total matches in database: ${allMatches.length}`)

    // Find matches that are NOT in the real matches list
    const matchesToDelete = allMatches.filter(match => {
      const isReal = realMatches.some(
        realMatch =>
          realMatch.home === match.homeTeam.code &&
          realMatch.away === match.awayTeam.code
      )
      return !isReal
    })

    console.log(`Matches to delete: ${matchesToDelete.length}`)

    if (matchesToDelete.length > 0) {
      console.log('\nDeleting non-real matches:')
      for (const match of matchesToDelete) {
        console.log(`- ${match.homeTeam.code} vs ${match.awayTeam.code}`)

        // First delete related guesses
        await prisma.guess.deleteMany({
          where: {
            matchId: match.id,
          },
        })

        // Then delete the match
        await prisma.match.delete({
          where: {
            id: match.id,
          },
        })
      }

      console.log('\n✅ Cleanup complete!')
    } else {
      console.log('\n✅ No matches to delete - all matches are real!')
    }

    // Show remaining matches
    const remainingMatches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    })

    console.log(`\nRemaining matches: ${remainingMatches.length}`)
    remainingMatches.forEach(match => {
      console.log(`- ${match.homeTeam.code} vs ${match.awayTeam.code}`)
    })

  } catch (error) {
    console.error('Error cleaning matches:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanMatches()