'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import { ShoppingCart, Star, MessageSquare } from 'lucide-react'
import { useCart } from '../../../context/CartContext'
import { api } from '@/lib/api'

type Review = {
  id: number
  rating: number
  comment: string
  createdAt: string
  user: { email: string }
}

type Product = {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  tag: string
  reviews: Review[]
}

export default function ProductDetailsPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  // Review Form
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    api.get<Product>(`/api/products/${id}`)
      .then(data => {
        setProduct(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [id])

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError('')
    const token = localStorage.getItem('token')
    if (!token) return setReviewError('You must be logged in to review.')

    try {
      await api.post('/api/reviews', { productId: parseInt(id as string), rating, comment })
      
      // Refresh product
      const prodData = await api.get<Product>(`/api/products/${id}`)
      setProduct(prodData)
      setComment('')
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-zinc-500">Loading product...</div>
        </div>
      </div>
    )
  }

  if (!product || product.error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400">Product not found.</div>
        </div>
      </div>
    )
  }

  const averageRating = product.reviews.length > 0 
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length 
    : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {/* Image */}
          <div className="aspect-square bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 relative">
            {product.tag && (
              <span className="absolute top-6 left-6 z-10 px-4 py-2 text-sm font-bold tracking-wider uppercase bg-white/10 backdrop-blur-md text-white rounded-full border border-white/10">
                {product.tag}
              </span>
            )}
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-indigo-400">${(product.price / 100).toFixed(2)}</span>
              <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium text-zinc-200">{averageRating ? averageRating.toFixed(1) : 'No reviews'}</span>
                <span className="text-zinc-500 text-sm ml-1">({product.reviews.length})</span>
              </div>
            </div>
            
            <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
              {product.description}
            </p>

            <button 
              onClick={() => addToCart(product.id, 1)}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-6 h-6" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-white/10 pt-12">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            <h2 className="text-3xl font-bold tracking-tight">Customer Reviews</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Write a review */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 h-fit">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              {reviewError && <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{reviewError}</div>}
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Rating</label>
                  <select 
                    value={rating} 
                    onChange={e => setRating(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Terrible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Comment</label>
                  <textarea 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                    rows={4}
                    placeholder="What did you think about this product?"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors">
                  Submit Review
                </button>
              </form>
            </div>

            {/* Review List */}
            <div className="lg:col-span-2 space-y-6">
              {product.reviews.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                  No reviews yet. Be the first to review this product!
                </div>
              ) : (
                product.reviews.map(review => (
                  <div key={review.id} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase">
                          {review.user.email[0]}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{review.user.email}</p>
                          <p className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-600'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
