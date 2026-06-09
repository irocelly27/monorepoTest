'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Star, TrendingUp, Search, User, LogOut } from 'lucide-react'
import { api } from '@/lib/api'

type Product = {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  tag: string
  createdAt: string
}

import { Navbar } from '../components/Navbar'
import { useCart } from '../context/CartContext'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const { addToCart } = useCart()

  useEffect(() => {
    // Fetch products
    api.get<Product[]>('/api/products')
      .then(data => setProducts(data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
            Discover the <br className="hidden md:block"/> Future of Tech.
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Explore our curated collection of premium gadgets and accessories designed to elevate your digital lifestyle.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
              Shop Now
            </button>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-medium border border-white/10 transition-all">
              View Categories
            </button>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
          <Link href="/products" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            View all <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="animate-pulse flex space-x-4 justify-center">
              <div className="w-4 h-4 bg-zinc-600 rounded-full"></div>
              <div className="w-4 h-4 bg-zinc-600 rounded-full"></div>
              <div className="w-4 h-4 bg-zinc-600 rounded-full"></div>
            </div>
            <p className="mt-4">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group relative bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:bg-white/[0.04] transition-colors flex flex-col">
                <div className="aspect-square overflow-hidden bg-zinc-900 relative">
                  {product.tag && (
                    <span className="absolute top-4 left-4 z-10 px-3 py-1 text-xs font-bold tracking-wider uppercase bg-white/10 backdrop-blur-md text-white rounded-full border border-white/10">
                      {product.tag}
                    </span>
                  )}
                  <Link href={`/product/${product.id}`}>
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100"
                    />
                  </Link>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xl font-bold tracking-tight">${(product.price / 100).toFixed(2)}</p>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium text-zinc-300">4.9</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-zinc-200 mb-2">{product.name}</h3>
                  <p className="text-sm text-zinc-500 mb-6 flex-1 line-clamp-2">{product.description}</p>
                  
                  <button 
                    onClick={() => addToCart(product.id, 1)}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-auto"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-zinc-500 text-sm mt-20">
        <p>&copy; {new Date().getFullYear()} Roce'sMarket. All rights reserved.</p>
      </footer>
    </div>
  )
}
