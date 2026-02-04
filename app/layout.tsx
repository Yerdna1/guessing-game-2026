import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { safeAuth } from '@/lib/safe-auth'
import { Toaster } from '@/components/ui/toaster'
import { ClearAuthButton } from '@/components/ClearAuthButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IBM & Olympic Games 2026 - Ice Hockey Guessing Game',
  description: 'Predict the scores of ice hockey matches during the IBM & Olympic Games 2026 in Milan & Cortina, Italy',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await safeAuth()

  // Show clear button if we detect JWT errors
  const showClearButton = !session && process.env.NODE_ENV === 'development'

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        {showClearButton && <ClearAuthButton />}
      </body>
    </html>
  )
}
