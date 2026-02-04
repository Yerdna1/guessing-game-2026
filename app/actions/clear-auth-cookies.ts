'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function clearAuthCookiesAction() {
  const cookieStore = await cookies()

  // Get all cookies and delete auth-related ones
  const allCookies = cookieStore.getAll()
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('authjs.') ||
        cookie.name.startsWith('next-auth.') ||
        cookie.name === 'authjs.csrf-token' ||
        cookie.name === 'authjs.callback-url' ||
        cookie.name === 'authjs.session-token') {
      cookieStore.delete(cookie.name)
    }
  })

  // Redirect to home
  redirect('/')
}