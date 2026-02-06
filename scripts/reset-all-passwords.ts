import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

const PASSWORD = '123456'

async function main() {
  console.log('Resetting all user passwords to:', PASSWORD)

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, emailVerified: true, role: true }
  })

  console.log(`Found ${users.length} users\n`)

  let updated = 0
  let verified = 0

  for (const user of users) {
    const data: { passwordHash: string; emailVerified?: Date } = { passwordHash }

    if (!user.emailVerified) {
      data.emailVerified = new Date()
      verified++
    }

    await prisma.user.update({
      where: { id: user.id },
      data
    })

    updated++
    console.log(`  ${updated}. ${user.name || '(no name)'} <${user.email}> [${user.role}] - password set${!user.emailVerified ? ' + email verified' : ''}`)
  }

  console.log(`\n${updated} users updated`)
  if (verified > 0) {
    console.log(`${verified} users had email verified`)
  }
  console.log(`\nAll users can now login with password: ${PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
