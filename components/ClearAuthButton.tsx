'use client'

import { Button } from '@/components/ui/button'
import { clearAuthCookiesAction } from '@/app/actions/clear-auth-cookies'
import { Trash2 } from 'lucide-react'

export function ClearAuthButton() {
  return (
    <form action={clearAuthCookiesAction}>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
        title="Clear authentication cookies to fix JWT errors"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear Auth Cookies
      </Button>
    </form>
  )
}