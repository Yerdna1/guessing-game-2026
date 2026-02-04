import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { prisma } from './prisma'
import * as bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required')
        }

        let user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        // Demo mode: Auto-create user if doesn't exist
        if (!user) {
          // Extract name from email (e.g., john@example.com -> John)
          const emailName = credentials.email as string
          const name = emailName.split('@')[0]
            .split('.')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')

          user = await prisma.user.create({
            data: {
              email: emailName,
              name: name,
              role: UserRole.USER,
            },
          })
        }

        // For demo purposes, we're not verifying password hash
        // In production, you would verify the password here
        // const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        // if (!isValid) {
        //   throw new Error('Invalid password')
        // }

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
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
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
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  // Handle JWT errors gracefully
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
})
