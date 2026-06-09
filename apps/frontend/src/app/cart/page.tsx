'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '../../components/Navbar'
import { useCart } from '../../context/CartContext'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'

export default function CartPage() {
  const { items, removeFromCart, clearCart, fetchCart } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const router = useRouter()

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  const handleCheckout = async () => {
    setCheckingOut(true)
    setCheckoutError('')
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login')
      return
    }

    try {
      await api.post('/api/orders/checkout')

      clearCart()
      await fetchCart()
      router.push('/profile?checkout=success')
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed')
      setCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-10">
          <ShoppingBag className="w-8 h-8 text-indigo-400" />
          <h1 className="text-4xl font-bold tracking-tight">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-32 bg-white/5 border border-white/10 rounded-3xl">
            <ShoppingBag className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-zinc-500 mb-8">Looks like you haven't added any products yet.</p>
            <button 
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map(item => (
                <div key={item.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-6 items-center">
                  <div className="w-24 h-24 bg-zinc-900 rounded-xl overflow-hidden shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.product.name}</h3>
                    <p className="text-indigo-400 font-medium">${(item.product.price / 100).toFixed(2)} x {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold mb-2">${((item.product.price * item.quantity) / 100).toFixed(2)}</p>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Panel */}
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 h-fit sticky top-28">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 text-zinc-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-400">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${((subtotal * 0.1) / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between font-bold text-xl text-white">
                  <span>Total</span>
                  <span>${((subtotal * 1.1) / 100).toFixed(2)}</span>
                </div>
              </div>

              {checkoutError && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                  {checkoutError}
                </div>
              )}

              <button 
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2"
              >
                {checkingOut ? 'Processing...' : 'Checkout Now'}
                {!checkingOut && <ArrowRight className="w-5 h-5" />}
              </button>
              <p className="text-center text-xs text-zinc-500 mt-4">
                Mock Checkout - This will process the order immediately without payment.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
