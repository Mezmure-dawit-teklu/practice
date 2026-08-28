'use client'

import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,107,0,0.15),rgba(255,255,255,0))]"></div>
      
      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md mb-8">
          <span className="flex h-2 w-2 rounded-full bg-[#FF6B00] animate-pulse"></span>
          Enterprise Core Infrastructure v2.4
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl max-w-4xl mx-auto leading-tight">
          Streamline compliance and <span className="text-[#FF6B00]">enterprise controls</span>
        </h1>
        
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto font-normal">
          Deploy structured taxonomy frameworks, track real-time audit readiness, and manage evidence mapping securely across your organization.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto rounded-xl bg-[#FF6B00] px-8 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-[#FF6B00]/25 hover:bg-[#ff8126] transition-all active:scale-95 cursor-pointer"
          >
            Access Console
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900/40 px-8 py-4 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
          >
            Explore Architecture
          </button>
        </div>
      </div>
    </section>
  )
}