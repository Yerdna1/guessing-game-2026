'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Trophy, Target, TrendingUp, Users, Calendar, MapPin, ArrowRight, Sparkles, Medal } from 'lucide-react'
import Link from 'next/link'
import { LoginModal } from '@/components/LoginModal'

export default function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
          </div>

          <div className="relative section-container">
            <div className="max-w-4xl mx-auto text-center py-24 md:py-32">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8 animate-fade-in border-2 border-white/30">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">IBM & Olympic Games 2026</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-white drop-shadow-2xl">Ice Hockey</span>
                <span className="block mt-2 text-4xl md:text-6xl font-extrabold text-white drop-shadow-2xl">
                  Guessing Game
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-emerald-50 mb-8 max-w-2xl mx-auto animate-slide-up font-medium" style={{ animationDelay: '0.2s' }}>
                Predict the scores. Compete with friends. Climb the leaderboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-6 text-lg shadow-2xl">
                    Start Playing Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/rules" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-6">
                    How It Works
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-emerald-100 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Milan & Cortina, Italy</span>
                </div>
                <div className="w-1 h-4 bg-white/30"></div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Feb 6-22, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative waves */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-16 sm:h-24 fill-slate-50 dark:fill-slate-950" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-to-b from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
          <div className="section-container">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { number: '13', label: 'National Teams', icon: Users },
                { number: '30+', label: 'Matches to Predict', icon: Trophy },
                { number: '17', label: 'Days of Competition', icon: Calendar },
              ].map((stat, index) => (
                <div key={index} className="stat-card text-center group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-5xl font-extrabold bg-gradient-to-br from-emerald-600 to-green-700 bg-clip-text mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                How It Works
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Three simple steps to join the excitement
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Predict Scores',
                  description: 'Before each match, submit your prediction for the final score of both teams',
                  icon: Target,
                  color: 'from-emerald-500 to-green-600',
                },
                {
                  step: '02',
                  title: 'Score Points',
                  description: 'Earn points based on the accuracy of your predictions - exact scores earn the most!',
                  icon: TrendingUp,
                  color: 'from-green-500 to-teal-600',
                },
                {
                  step: '03',
                  title: 'Climb Rankings',
                  description: 'Compete with friends and other fans to reach the top of the leaderboard',
                  icon: Trophy,
                  color: 'from-teal-500 to-cyan-600',
                },
              ].map((step, index) => (
                <div key={index} className="relative group">
                  <div className="card-excel p-8 h-full">
                    <div className={`absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl`}>
                      {step.step}
                    </div>
                    <div className="pt-8">
                      <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${step.color} rounded-xl mb-6 shadow-lg`}>
                        <step.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                        {step.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scoring System */}
        <section className="py-24 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                Scoring System
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
                More accurate predictions = more points
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-6">
                  <h3 className="text-2xl font-bold text-white">Points Breakdown</h3>
                  <p className="text-emerald-100 text-sm mt-1">For each match prediction</p>
                </div>
                <CardContent className="p-8 space-y-4">
                  {[
                    {
                      points: '4',
                      label: 'Exact Score',
                      description: 'Perfect prediction - you nailed it!',
                      color: 'bg-gradient-to-r from-emerald-500 to-green-600',
                      textColor: 'text-emerald-700',
                      bgColor: 'bg-emerald-50',
                    },
                    {
                      points: '2',
                      label: 'Winner + One Team Score',
                      description: 'Correct winner and one team score exact',
                      color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
                      textColor: 'text-blue-700',
                      bgColor: 'bg-blue-50',
                    },
                    {
                      points: '1',
                      label: 'Correct Winner Only',
                      description: 'You predicted which team would win',
                      color: 'bg-gradient-to-r from-amber-500 to-orange-600',
                      textColor: 'text-amber-700',
                      bgColor: 'bg-amber-50',
                    },
                  ].map((tier, index) => (
                    <div key={index} className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all ${index === 0 ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' : index === 1 ? 'bg-blue-50 border-blue-200 hover:border-blue-400' : 'bg-amber-50 border-amber-200 hover:border-amber-400'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 ${tier.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-2xl font-bold text-white">{tier.points}</span>
                        </div>
                        <div>
                          <h4 className={`font-bold text-lg ${index === 0 ? 'text-emerald-800' : index === 1 ? 'text-blue-800' : 'text-amber-800'}`}>{tier.label}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{tier.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                          {tier.points} pts
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Medal className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-1">Playoff Bonus</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          All playoff matches include a <span className="font-bold text-purple-700 dark:text-purple-300">+1 bonus point</span> added to each scenario.
                          That means exact scores in playoff matches are worth <span className="font-bold">5 points</span>!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative section-container text-center text-white">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Compete?
              </h2>
              <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
                Join thousands of hockey fans predicting the outcomes of the Olympic ice hockey tournament
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-10 py-6 text-lg shadow-2xl">
                  Create Your Account Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Login Modal */}
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
    </div>
  )
}
