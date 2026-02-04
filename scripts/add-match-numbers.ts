import { prisma } from '@/lib/prisma'

async function addMatchNumbers() {
  try {
    console.log('🏟️  Adding match numbers to all matches...\n')

    // Get all matches ordered by scheduled time
    const matches = await prisma.match.findMany({
      where: { tournamentId: 'default' },
      orderBy: { scheduledTime: 'asc' },
    })

    console.log(`Found ${matches.length} matches\n`)

    // Update each match with its number
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const matchNumber = i + 1

      await prisma.match.update({
        where: { id: match.id },
        data: { matchNumber }
      })

      const homeTeam = match.homeTeamId ? (await prisma.team.findUnique({ where: { id: match.homeTeamId } }))?.code : '?'
      const awayTeam = match.awayTeamId ? (await prisma.team.findUnique({ where: { id: match.awayTeamId } }))?.code : '?'

      console.log(`✅ Match ${matchNumber}: ${homeTeam} vs ${awayTeam} - ${new Date(match.scheduledTime).toLocaleDateString()}`)
    }

    console.log(`\n🎉 Successfully added match numbers to ${matches.length} matches`)

  } catch (error) {
    console.error('❌ Error adding match numbers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMatchNumbers()
