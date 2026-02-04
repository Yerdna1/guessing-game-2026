import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

const EMAIL = 'andrej.galad@ibm.com'
const NEW_PASSWORD = '123456'

async function main() {
  console.log('Checking user:', EMAIL)

  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      passwordHash: true,
      role: true,
    }
  })

  if (!user) {
    console.log('❌ User not found!')
    return
  }

  console.log('\nUser found:')
  console.log('  Email:', user.email)
  console.log('  Name:', user.name)
  console.log('  Role:', user.role)
  console.log('  Email Verified:', user.emailVerified ? 'Yes (' + user.emailVerified + ')' : 'No')
  console.log('  Has Password Hash:', user.passwordHash ? 'Yes' : 'No')

  // Check if email verification is the issue
  if (!user.emailVerified) {
    console.log('\n⚠️  Email not verified - this will block login!')
    console.log('   Marking email as verified...')

    await prisma.user.update({
      where: { email: EMAIL },
      data: { emailVerified: new Date() }
    })

    console.log('   ✅ Email verified')
  }

  // Reset password
  console.log('\nResetting password to:', NEW_PASSWORD)
  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10)

  await prisma.user.update({
    where: { email: EMAIL },
    data: { passwordHash }
  })

  console.log('✅ Password reset successfully')
  console.log('\nYou should now be able to login with:')
  console.log('  Email:', EMAIL)
  console.log('  Password:', NEW_PASSWORD)

  // Verify the update
  const updatedUser = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: {
      emailVerified: true,
      passwordHash: true,
    }
  })

  console.log('\nVerification:')
  console.log('  Email Verified:', updatedUser?.emailVerified ? '✅ Yes' : '❌ No')
  console.log('  Password Hash:', updatedUser?.passwordHash ? '✅ Set' : '❌ Not set')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
