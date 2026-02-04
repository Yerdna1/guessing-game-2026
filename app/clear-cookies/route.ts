import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
  const cookieStore = await cookies()

  // Get all cookies
  const allCookies = cookieStore.getAll()

  // Delete each cookie
  allCookies.forEach(cookie => {
    cookieStore.delete(cookie.name)
  })

  // Redirect to home
  redirect('/')
}