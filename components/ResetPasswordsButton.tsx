'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { KeyRound } from 'lucide-react'

export function ResetPasswordsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message?: string; error?: string } | null>(null)

  async function handleReset() {
    if (!confirm('This will reset ALL user passwords to "123456" and verify all emails. Continue?')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/reset-passwords', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setResult({ message: data.message })
      } else {
        setResult({ error: data.error || 'Failed to reset passwords' })
      }
    } catch {
      setResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleReset}
        disabled={loading}
        variant="destructive"
        className="gap-2"
      >
        <KeyRound className="h-4 w-4" />
        {loading ? 'Resetting...' : 'Reset All Passwords'}
      </Button>
      {result?.message && (
        <p className="mt-2 text-sm text-green-600">{result.message}</p>
      )}
      {result?.error && (
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
      )}
    </div>
  )
}
