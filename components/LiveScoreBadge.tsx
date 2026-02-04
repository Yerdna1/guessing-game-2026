'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, XCircle, Radio } from 'lucide-react'

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'

interface LiveScoreBadgeProps {
  status: MatchStatus
  scheduledTime?: Date
}

export function LiveScoreBadge({ status, scheduledTime }: LiveScoreBadgeProps) {
  switch (status) {
    case 'SCHEDULED':
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Upcoming
        </Badge>
      )
    case 'LIVE':
      return (
        <Badge className="gap-1 bg-red-500 hover:bg-red-600 animate-pulse">
          <Radio className="h-3 w-3" />
          LIVE
        </Badge>
      )
    case 'COMPLETED':
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Final
        </Badge>
      )
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      )
    default:
      return null
  }
}
