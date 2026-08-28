'use client'

import { useRouter } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div 
            onClick={() => router.push('/')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00] text-slate-950 font-black text-xl shadow-lg shadow-[#FF6B00]/20 mb-4 cursor-pointer hover:scale-105 transition-transform"
          >
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign in to Enterprise Core</h1>
          <p className="text-sm text-slate-400 mt-1">Enter your credentials to manage compliance protocols</p>
        </div>
        
        <LoginForm />
      </div>
    </main>
  )
}