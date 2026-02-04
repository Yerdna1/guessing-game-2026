import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import ExcelClient from './excel-client'

export default function ExcelPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ExcelClient />
      </main>
      <Footer />
    </div>
  )
}