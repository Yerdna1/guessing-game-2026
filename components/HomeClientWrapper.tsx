'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoginModal } from '@/components/LoginModal'

export function HomeClientWrapper({ children }: { children: React.ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <>
      {children}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Floating Sign In Button */}
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
