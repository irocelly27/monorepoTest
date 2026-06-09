'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, TrendingUp, Search, User, LogOut } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { api } from '@/lib/api'

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: number, email: string, role: string } | null>(null)
  const { cartCount } = useCart()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get<{user: any}>('/api/auth/me')
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(() => localStorage.removeItem('token'))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      } else {
        router.push('/products')
      }
    }
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Roce'sMarket
          </span>
        </Link>
        
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search for products..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all placeholder:text-zinc-600 text-white"
          />
        </div>

        <div className="flex items-center gap-6">
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Admin Panel
            </Link>
          )}
          
          <Link href="/cart" className="relative p-2 text-zinc-400 hover:text-white transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#0a0a0a]">
                {cartCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                <span className="max-w-[100px] truncate">{user.email}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
