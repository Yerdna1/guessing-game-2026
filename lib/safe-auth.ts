import { auth } from './auth'

/**
 * Safe auth wrapper that handles JWT decryption errors
 * Returns null session if there's an error (e.g., old cookies)
 */
export async function safeAuth() {
  try {
    return await auth()
  } catch (error: any) {
    // JWT decryption errors happen when NEXTAUTH_SECRET changes
    // Return null session, user will need to sign in again
    return null
  }
}
