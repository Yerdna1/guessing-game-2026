import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { prisma } from './prisma'
import * as bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        const email = credentials.email as string
        let user = await prisma.user.findUnique({
          where: { email },
        })

        // Demo mode: Auto-create user if doesn't exist
        if (!user) {
          // Extract name from email (e.g., john@example.com -> John)
          const name = email.split('@')[0]
            .split('.')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')

          user = await prisma.user.create({
            data: {
              email,
              name,
              role: UserRole.USER,
            },
          })
        }

        // Verify password if user has a password hash
        if (user.passwordHash) {
          const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)
          if (!isValid) {
            return null
          }
        }
        // For backward compatibility, accept any password if no hash is set

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Redirect to home page after sign out
      if (url === '/login' || url === `${baseUrl}/login`) {
        return baseUrl
      }
      // If url is already a full URL, return it
      if (url.startsWith('http')) {
        return url
      }
      return baseUrl
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || UserRole.USER
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        // Create or update user from OAuth
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email || '' },
        })

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email || '',
              name: user.name,
              image: user.image,
              role: UserRole.USER,
            },
          })
        }
      }
      return true
    },
  },
  session: {
    strategy: 'jwt',
  },
  // Handle JWT errors gracefully
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  debug: false, // Disable debug logs in production
  logger: {
    error: (error: Error) => {
      // Suppress JWT decryption errors (they're handled by safeAuth)
      if (error.message.includes('no matching decryption secret')) {
        return
      }
      console.error(error)
    },
    warn: (code: any) => console.warn(code)
  }
})
