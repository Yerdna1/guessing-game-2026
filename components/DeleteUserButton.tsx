'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteUserButtonProps {
  userId: string
  userName: string | null
  userEmail: string
}

export function DeleteUserButton({ userId, userName, userEmail }: DeleteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const formData = new FormData()
      formData.append('userId', userId)

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json()
        alert('Failed to delete user: ' + (error.error || 'Unknown error'))
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="gap-1"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user <strong>{userName || 'Unknown'}</strong> ({userEmail})?
              This will also delete all their predictions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
