import { prisma } from '@/lib/prisma'

const EMAIL_TO_KEEP = 'andrej.galad@ibm.com'

async function main() {
  console.log('Finding all users except:', EMAIL_TO_KEEP)

  // Find all users except the one to keep
  const usersToDelete = await prisma.user.findMany({
    where: {
      NOT: {
        email: EMAIL_TO_KEEP
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
    }
  })

  console.log(`Found ${usersToDelete.length} users to delete:`)
  usersToDelete.forEach(user => {
    console.log(`  - ${user.email} (${user.name})`)
  })

  // Delete all rankings for these users first
  console.log('\nDeleting rankings...')
  for (const user of usersToDelete) {
    await prisma.ranking.deleteMany({
      where: { userId: user.id }
    })
  }

  // Delete all guesses for these users
  console.log('Deleting guesses...')
  for (const user of usersToDelete) {
    await prisma.guess.deleteMany({
      where: { userId: user.id }
    })
  }

  // Delete the users
  console.log('Deleting users...')
  for (const user of usersToDelete) {
    await prisma.user.delete({
      where: { id: user.id }
    })
    console.log(`  Deleted: ${user.email}`)
  }

  console.log('\n✅ Done! Only user remaining:', EMAIL_TO_KEEP)

  // Verify
  const remainingUsers = await prisma.user.findMany({
    select: {
      email: true,
      name: true
    }
  })

  console.log('\nRemaining users:')
  remainingUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.name})`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
