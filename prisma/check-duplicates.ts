import { prisma } from '../lib/prisma'

async function checkDuplicates() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [
        { homeTeam: { code: 'asc' } },
        { awayTeam: { code: 'asc' } },
        { scheduledTime: 'asc' }
      ],
    })

    // Group matches by home and away team
    const matchGroups = new Map<string, typeof matches>()

    matches.forEach(match => {
      const key = `${match.homeTeam.code}-${match.awayTeam.code}`
      if (!matchGroups.has(key)) {
        matchGroups.set(key, [])
      }
      matchGroups.get(key)!.push(match)
    })

    console.log('Match duplicates analysis:')
    console.log('=========================\n')

    // Show duplicates
    let totalDuplicates = 0
    matchGroups.forEach((matches, key) => {
      if (matches.length > 1) {
        console.log(`${key}: ${matches.length} duplicates`)
        matches.forEach(match => {
          console.log(`  - ID: ${match.id}, Date: ${new Date(match.scheduledTime).toLocaleString()}, Stage: ${match.stage}`)
        })
        totalDuplicates += matches.length - 1
      }
    })

    console.log(`\nTotal duplicate matches to remove: ${totalDuplicates}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicates()