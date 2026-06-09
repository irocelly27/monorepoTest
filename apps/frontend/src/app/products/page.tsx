'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navbar } from '../../components/Navbar'
import { ShoppingCart, Star, Search, Filter } from 'lucide-react'
import { useCart } from '../../context/CartContext'
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

const AVAILABLE_TAGS = ['Bestseller', 'New', 'Trending', 'Premium']

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToCart } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Filter State
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  
  const initialTags = searchParams.getAll('tag')
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)
  
  const [sort, setSort] = useState(searchParams.get('sort') || '')

  useEffect(() => {
    // Whenever URL params change, fetch products
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams(searchParams.toString())
        const data = await api.get<Product[]>(`/api/products?${params.toString()}`)
        setProducts(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [searchParams])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (minPrice) params.set('minPrice', Math.round(parseFloat(minPrice) * 100).toString()) // store in cents
    if (maxPrice) params.set('maxPrice', Math.round(parseFloat(maxPrice) * 100).toString())
    if (sort) params.set('sort', sort)
    selectedTags.forEach(tag => params.append('tag', tag))
    
    router.push(`/products?${params.toString()}`)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold">Filters</h2>
            </div>
            
            <div className="space-y-6 bg-white/5 border border-white/10 p-5 rounded-2xl">
              
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Search Query</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Price Range ($)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-zinc-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Tags / Category */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">Categories</label>
                <div className="space-y-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <label key={tag} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedTags.includes(tag) ? 'bg-indigo-600 border-indigo-600' : 'bg-black/50 border-white/20 group-hover:border-indigo-400'}`}>
                        {selectedTags.includes(tag) && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </div>
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={applyFilters}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <h1 className="text-xl font-medium text-zinc-300">
              Showing <span className="font-bold text-white">{products.length}</span> products
              {searchParams.get('q') ? ` for "${searchParams.get('q')}"` : ''}
            </h1>

            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">Sort by:</span>
              <select 
                value={sort}
                onChange={e => {
                  setSort(e.target.value)
                  // Immediately apply sort when changed
                  const params = new URLSearchParams(searchParams.toString())
                  if (e.target.value) params.set('sort', e.target.value)
                  else params.delete('sort')
                  router.push(`/products?${params.toString()}`)
                }}
                className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none cursor-pointer"
              >
                <option value="" className="bg-zinc-900">Newest Arrival</option>
                <option value="price_asc" className="bg-zinc-900">Price: Low to High</option>
                <option value="price_desc" className="bg-zinc-900">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-zinc-500">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-20 border border-dashed border-white/10 rounded-3xl">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg">No products found matching your criteria.</p>
              <button 
                onClick={() => router.push('/products')}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.04] transition-colors flex flex-col">
                  <div className="aspect-square overflow-hidden bg-zinc-900 relative">
                    {product.tag && (
                      <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-white/10 backdrop-blur-md text-white rounded-md border border-white/10">
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
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-medium text-zinc-200 mb-1 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xl font-bold tracking-tight text-white">${(product.price / 100).toFixed(2)}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-medium text-zinc-400">4.9</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => addToCart(product.id, 1)}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-auto border border-white/5"
                    >
                      <ShoppingCart className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-500">Loading...</div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
