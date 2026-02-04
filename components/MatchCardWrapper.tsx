'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchCard, Match } from './MatchCard'
import { useToast } from '@/hooks/use-toast'

interface MatchCardWrapperProps {
  match: Match
  isAuthenticated: boolean
  enableAI?: boolean
}

export function MatchCardWrapper({ match, isAuthenticated, enableAI = false }: MatchCardWrapperProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitGuess = async (matchId: string, homeScore: number, awayScore: number) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/guesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          homeScore,
          awayScore,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit guess')
      }

      toast({
        title: 'Success!',
        description: 'Your prediction has been saved.',
      })

      // Refresh the page to show the updated guess
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit guess',
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGetAIPrediction = async (matchId: string) => {
    try {
      const response = await fetch('/api/ai-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get AI prediction')
      }

      const data = await response.json()
      return {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        reasoning: data.reasoning,
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI prediction',
      })
      throw error
    }
  }

  return (
    <MatchCard
      match={match}
      isAuthenticated={isAuthenticated}
      onSubmitGuess={handleSubmitGuess}
      onGetAIPrediction={enableAI ? handleGetAIPrediction : undefined}
    />
  )
}