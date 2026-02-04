import { prisma } from '@/lib/prisma'

async function makeAdmins() {
  try {
    const adminEmails = [
      'andrej.galad@ibm.com',
      'peter.niroda@sk.ibm.cm' // Note: This appears to be the correct email based on the database
    ]

    console.log('🔑 Updating admin roles...\n')

    for (const email of adminEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        })
        console.log(`✅ ${user.name} (${email}) is now an ADMIN`)
      } else {
        console.log(`❌ User not found: ${email}`)
      }
    }

    // Show all admins
    const allAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        name: true,
        email: true
      }
    })

    console.log('\n👑 Current admins:')
    allAdmins.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email})`)
    })

  } catch (error) {
    console.error('Error updating admin roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmins()