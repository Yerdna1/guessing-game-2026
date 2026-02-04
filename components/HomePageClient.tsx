'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { LoginModal } from '@/components/LoginModal'

export function HomePageClient({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <>
      {children}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Sign In Modal Trigger - Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsLoginOpen(true)}
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-full px-6"
        >
          Sign In
        </Button>
      </div>
    </>
  )
}
