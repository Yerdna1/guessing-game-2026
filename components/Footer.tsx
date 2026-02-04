import { Trophy, Calendar, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-emerald-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg blur-sm"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg shadow-lg">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                Guessing Game
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Ice Hockey Prediction Challenge for the Olympic Games 2026
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>Milan & Cortina</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Feb 2026</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/rules" className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Rules & Scoring
                </Link>
              </li>
              <li>
                <Link href="/standings" className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Standings
                </Link>
              </li>
            </ul>
          </div>

          {/* Tournament Info */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Tournament</h4>
            <ul className="space-y-2">
              <li className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">12 National Teams</span>
              </li>
              <li className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">30+ Matches</span>
              </li>
              <li className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">17 Days of Competition</span>
              </li>
              <li className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Group Stage + Playoffs</span>
              </li>
            </ul>
          </div>

          {/* Scoring */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Points System</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  4
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Exact Score</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  2
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Winner + One Score</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  1
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Correct Winner</span>
              </div>
              <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium text-center">
                  🏆 Playoff Bonus: +1 point
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-200 dark:border-emerald-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {currentYear} Guessing Game. Built by{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Yerdna</span>
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://olympics.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Olympics 2026
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
