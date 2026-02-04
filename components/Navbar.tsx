import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { safeAuth } from '@/lib/safe-auth'
import { signOutAction } from '@/app/actions'
import { Trophy, Home, LogOut, User, Settings, LayoutDashboard, Users, Eye, Table } from 'lucide-react'

export async function Navbar() {
  const session = await safeAuth()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg shadow-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              Guessing Game
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="nav-link">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>

            {/* Public links - visible to everyone */}
            <Link href="/standings">
              <Button variant="ghost" size="sm" className="nav-link">
                Standings
              </Button>
            </Link>
            <Link href="/predictions">
              <Button variant="ghost" size="sm" className="nav-link">
                <Eye className="h-4 w-4 mr-2" />
                All Predictions
              </Button>
            </Link>
            <Link href="/excel">
              <Button variant="ghost" size="sm" className="nav-link">
                <Table className="h-4 w-4 mr-2" />
                Excel View
              </Button>
            </Link>
            <Link href="/rules">
              <Button variant="ghost" size="sm" className="nav-link">
                Rules
              </Button>
            </Link>

            {/* Authenticated user links */}
            {session && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="nav-link">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/matches">
                  <Button variant="ghost" size="sm" className="nav-link">
                    Matches
                  </Button>
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="nav-link">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {session.user.name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <form action={signOutAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-400 dark:hover:border-emerald-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
