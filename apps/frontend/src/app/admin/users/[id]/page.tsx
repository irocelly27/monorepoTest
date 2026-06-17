'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User as UserIcon, Calendar, Mail, Shield, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'

type Product = {
  id: number
  name: string
  imageUrl: string | null
}

type OrderItem = {
  quantity: number
  priceAtPurchase: number
  product: Product
}

type Order = {
  id: number
  totalPrice: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  rejectionReason: string | null
  createdAt: string
  items: OrderItem[]
}

type UserDetail = {
  id: number
  email: string
  role: string
  createdAt: string
}

export default function AdminUserDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!id) return
    fetchUserDetail()
  }, [id])

  const fetchUserDetail = async () => {
    try {
      const data = await api.get<{ user: UserDetail, orders: Order[] }>(`/api/users/${id}`)
      setUser(data.user)
      setOrders(data.orders || [])
    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Failed to fetch user details')
    } finally {
      setLoading(false)
    }
  }

  const toggleOrder = (orderId: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700'
      case 'PROCESSING': return 'bg-blue-100 text-blue-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-amber-100 text-amber-700'
    }
  }

  if (loading) return <div className="animate-pulse text-zinc-500">Loading user details...</div>
  
  if (error || !user) return (
    <div className="text-center py-12">
      <div className="text-red-500 mb-4">{error || 'User not found'}</div>
      <button onClick={() => router.back()} className="text-indigo-600 hover:underline">Go back</button>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
          User Details <span className="text-zinc-400 font-normal text-lg">#{user.id}</span>
        </h2>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-10 h-10" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">{user.email}</h3>
              <p className="text-zinc-500 text-sm">Customer since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center gap-3 text-zinc-600">
                <Mail className="w-5 h-5 text-zinc-400" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <Shield className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-medium">Role: <span className="text-zinc-900">{user.role}</span></span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <Calendar className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-medium">Joined: <span className="text-zinc-900">{new Date(user.createdAt).toLocaleDateString()}</span></span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <Package className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-medium">Total Orders: <span className="text-zinc-900">{orders.length}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <h3 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Transaction History</h3>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500">
          This user has no transactions yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div 
                className="p-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => toggleOrder(order.id)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-900">Order #{order.id}</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className="text-lg font-bold text-zinc-900">${(order.totalPrice / 100).toFixed(2)}</span>
                  {expandedOrders[order.id] ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                </div>
              </div>

              {expandedOrders[order.id] && (
                <div className="border-t border-zinc-100 p-6 bg-zinc-50/50">
                  <h4 className="text-sm font-bold text-zinc-900 mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-zinc-200">
                        <div className="w-12 h-12 rounded overflow-hidden bg-zinc-100 flex-shrink-0">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900">{item.product.name}</p>
                          <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-bold text-zinc-900">
                          ${((item.priceAtPurchase * item.quantity) / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 text-sm">
                      <span className="font-bold">Cancellation Reason:</span> {order.rejectionReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
