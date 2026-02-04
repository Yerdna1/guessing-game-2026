import { safeAuth } from '@/lib/safe-auth'
import { NavbarClient } from '@/components/NavbarClient'

export async function Navbar() {
  const session = await safeAuth()
  return <NavbarClient session={session} />
}
