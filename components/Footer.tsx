import { Trophy } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-semibold">IBM & Olympic Games 2026</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Ice Hockey Guessing Game - Milan & Cortina, Italy
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/rules" className="hover:text-foreground">
              Rules
            </Link>
            <Link href="/standings" className="hover:text-foreground">
              Standings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
