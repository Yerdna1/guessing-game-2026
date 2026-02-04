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

interface DeleteMatchButtonProps {
  matchId: string
  matchNumber: number
  homeTeam: string
  awayTeam: string
}

export function DeleteMatchButton({ matchId, matchNumber, homeTeam, awayTeam }: DeleteMatchButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const formData = new FormData()
      formData.append('matchId', matchId)

      const response = await fetch('/api/admin/delete-match', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.text()
        alert('Failed to delete match: ' + error)
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Failed to delete match')
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
            <DialogTitle>Confirm Delete Match #{matchNumber}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the match between <strong>{homeTeam}</strong> and <strong>{awayTeam}</strong>?
              This will also delete all user predictions for this match. This action cannot be undone.
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
              {isDeleting ? 'Deleting...' : 'Delete Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
