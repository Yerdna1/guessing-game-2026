import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { safeAuth } from '@/lib/safe-auth'
import { Toaster } from '@/components/ui/toaster'

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

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
