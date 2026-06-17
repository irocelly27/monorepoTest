'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, Home, Settings, LogOut, LayoutDashboard, Users } from 'lucide-react'
import { api } from '@/lib/api'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    api.get<{user: any}>('/api/auth/me')
      .then(data => {
        if (!data.user || data.user.role !== 'ADMIN') {
          router.push('/')
        } else {
          setIsAuthorized(true)
        }
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
          <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
          <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <span className="text-xl font-bold text-indigo-600">Roce's Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Package className="w-5 h-5" /> Products
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Users className="w-5 h-5" /> Users
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors mt-8">
            <Home className="w-5 h-5" /> View Shop
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-medium text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center px-8 shadow-sm z-10">
          <h1 className="text-lg font-semibold text-zinc-800">Admin Dashboard</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
