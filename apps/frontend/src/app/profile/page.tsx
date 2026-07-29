'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '../../components/Navbar'
import { User, Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'

type OrderItem = {
  quantity: number
  priceAtPurchase: number
  product: {
    id: number
    name: string
    imageUrl: string
  }
}

type Order = {
  id: number
  totalPrice: number
  status: string
  createdAt: string
  rejectionReason?: string
  items: OrderItem[]
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ id: number, email: string, role: string } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  
  const checkoutSuccess = searchParams.get('checkout') === 'success'

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    Promise.all([
      api.get<{user: any}>('/api/auth/me'),
      api.get<Order[]>('/api/orders/me')
    ])
      .then(([userData, ordersData]) => {
        setUser(userData.user)
        setOrders(ordersData)
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const completeOrder = async (orderId: number) => {
    try {
      await api.put(`/api/orders/me/${orderId}/complete`)
      // Refresh orders
      const ordersData = await api.get<Order[]>('/api/orders/me')
      setOrders(ordersData)
    } catch (err) {
      alert((err as Error).message || 'Failed to complete order')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-zinc-500">Loading profile...</div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'PROCESSING': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'COMPLETED': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'PROCESSING': return <Package className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {checkoutSuccess && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h3 className="font-bold">Checkout Successful!</h3>
              <p className="text-sm opacity-80">Your mock order has been placed and is now PENDING.</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mb-12 bg-white/5 p-8 rounded-3xl border border-white/10">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
            <User className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{user?.email}</h1>
            <p className="text-zinc-500 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-white/10 rounded text-xs font-bold uppercase">{user?.role}</span>
              Member
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-6">Purchase History</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-zinc-500">
            You haven't made any purchases yet.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 bg-white/5 flex flex-wrap gap-4 items-center justify-between border-b border-white/10">
                  <div className="flex gap-8 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">Order Placed</p>
                      <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Total</p>
                      <p className="font-medium">${(order.totalPrice / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Order ID</p>
                      <p className="font-medium">#{order.id}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-lg overflow-hidden shrink-0">
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product.name}</h4>
                          <p className="text-zinc-400 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${((item.priceAtPurchase * item.quantity) / 100).toFixed(2)}</p>
                          <button 
                            onClick={() => router.push(`/product/${item.product.id}`)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            View Product / Leave Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.status === 'PROCESSING' && (
                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                      <p className="text-sm text-zinc-400">Your order has been shipped. Please confirm when you receive it.</p>
                      <button 
                        onClick={() => completeOrder(order.id)}
                        className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Finish / Complete Order
                      </button>
                    </div>
                  )}
                  {order.rejectionReason && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-sm font-bold text-red-400 mb-1">Reason for Cancellation:</p>
                        <p className="text-sm text-red-300/80">{order.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
