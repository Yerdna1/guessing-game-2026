import { prisma } from '@/lib/prisma'

async function recreateMatch18() {
  try {
    console.log('🏒 Recreating Match #18: USA vs Germany...\n')

    // Find USA and Germany teams
    const usaTeam = await prisma.team.findUnique({
      where: { code: 'USA' }
    })

    const germanyTeam = await prisma.team.findUnique({
      where: { code: 'GER' }
    })

    if (!usaTeam) {
      console.log('❌ USA team not found')
      return
    }

    if (!germanyTeam) {
      console.log('❌ Germany team not found')
      return
    }

    // Create the match
    const scheduledTime = new Date(Date.UTC(2026, 1, 15, 21, 10, 0)) // Feb 15, 2026, 21:10 UTC

    const match = await prisma.match.create({
      data: {
        tournamentId: 'default',
        homeTeamId: usaTeam.id,
        awayTeamId: germanyTeam.id,
        scheduledTime,
        venue: 'Milano Santagiulia',
        stage: 'GROUP_STAGE',
        status: 'SCHEDULED',
        isPlayoff: false,
        matchNumber: 18
      }
    })

    console.log(`✅ Match #18 recreated successfully`)
    console.log(`   ${usaTeam.code} vs ${germanyTeam.code}`)
    console.log(`   Date: Feb 15, 2026`)
    console.log(`   Time: 21:10`)
    console.log(`   Venue: Milano Santagiulia`)
    console.log(`   Match ID: ${match.id}`)

  } catch (error) {
    console.error('❌ Error recreating match:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recreateMatch18()
