'use client'

import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00] text-slate-950 font-black shadow-lg shadow-[#FF6B00]/20">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white">Practice</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Enterprise Core</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <span className="hover:text-[#FF6B00] transition-colors cursor-pointer">Architecture</span>
          <span className="hover:text-[#FF6B00] transition-colors cursor-pointer">Capabilities</span>
          <span className="hover:text-[#FF6B00] transition-colors cursor-pointer">Security</span>
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            type="button"
            onClick={() => router.push('/login')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2 cursor-pointer"
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => router.push('/login')}
            className="rounded-lg bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-[#FF6B00]/20 hover:bg-[#ff8126] transition-all active:scale-95 cursor-pointer"
          >
            Access Console
          </button>
        </div>
      </div>
    </header>
  )
}