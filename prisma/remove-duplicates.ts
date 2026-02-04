import { prisma } from '../lib/prisma'

async function removeDuplicates() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        guesses: true,
      },
      orderBy: [
        { homeTeam: { code: 'asc' } },
        { awayTeam: { code: 'asc' } },
        { createdAt: 'asc' }  // Keep the oldest one
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

    console.log('Removing duplicate matches...')
    console.log('============================\n')

    let totalDeleted = 0
    let totalGuessesDeleted = 0

    // Process each group
    for (const [key, matches] of matchGroups.entries()) {
      if (matches.length > 1) {
        console.log(`\n${key}: ${matches.length} instances found`)

        // Keep the first one (oldest), delete the rest
        const [toKeep, ...toDelete] = matches
        console.log(`  Keeping: ${toKeep.id} (${new Date(toKeep.scheduledTime).toLocaleDateString()})`)

        // Migrate guesses from duplicates to the one we're keeping
        for (const match of toDelete) {
          console.log(`  Deleting: ${match.id} (${new Date(match.scheduledTime).toLocaleDateString()})`)

          // For each guess on the duplicate match
          for (const guess of match.guesses) {
            // Check if this user already has a guess on the match we're keeping
            const existingGuess = await prisma.guess.findUnique({
              where: {
                userId_matchId: {
                  userId: guess.userId,
                  matchId: toKeep.id
                }
              }
            })

            if (!existingGuess) {
              // Move the guess to the match we're keeping
              console.log(`    Moving guess from user ${guess.userId}`)
              await prisma.guess.update({
                where: { id: guess.id },
                data: { matchId: toKeep.id }
              })
            } else {
              // Delete the duplicate guess
              console.log(`    Deleting duplicate guess from user ${guess.userId}`)
              await prisma.guess.delete({
                where: { id: guess.id }
              })
              totalGuessesDeleted++
            }
          }

          // Now delete the duplicate match
          await prisma.match.delete({
            where: { id: match.id }
          })
          totalDeleted++
        }
      }
    }

    console.log(`\n✅ Cleanup complete!`)
    console.log(`   Deleted ${totalDeleted} duplicate matches`)
    console.log(`   Deleted ${totalGuessesDeleted} duplicate guesses`)

    // Show final count
    const finalCount = await prisma.match.count()
    console.log(`\n   Total matches remaining: ${finalCount}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeDuplicates()