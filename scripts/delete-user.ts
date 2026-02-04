import { prisma } from '@/lib/prisma'

async function deleteUser() {
  const emailToDelete = 'andrej.galad@gmail.com'

  try {
    console.log(`🔍 Looking for user: ${emailToDelete}`)

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email: emailToDelete },
      include: {
        guesses: true,
        rankings: true,
        accounts: true,
        sessions: true,
      },
    })

    if (!user) {
      console.log(`❌ User not found: ${emailToDelete}`)
      return
    }

    console.log(`\n📊 Found user: ${user.name || 'No name'} (${user.email})`)
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Guesses: ${user.guesses.length}`)
    console.log(`   - Rankings: ${user.rankings.length}`)
    console.log(`   - Accounts: ${user.accounts.length}`)
    console.log(`   - Sessions: ${user.sessions.length}`)

    // Delete guesses
    console.log(`\n🗑️  Deleting ${user.guesses.length} guesses...`)
    await prisma.guess.deleteMany({
      where: { userId: user.id },
    })
    console.log(`✅ Guesses deleted`)

    // Delete rankings
    console.log(`\n🗑️  Deleting ${user.rankings.length} rankings...`)
    await prisma.ranking.deleteMany({
      where: { userId: user.id },
    })
    console.log(`✅ Rankings deleted`)

    // Delete the user (accounts and sessions should cascade automatically)
    console.log(`\n🗑️  Deleting user...`)
    await prisma.user.delete({
      where: { id: user.id },
    })
    console.log(`✅ User deleted`)

    console.log(`\n🎉 Successfully deleted user ${emailToDelete} and all related data`)

  } catch (error) {
    console.error('❌ Error deleting user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteUser()
