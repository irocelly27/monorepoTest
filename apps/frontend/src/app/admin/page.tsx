'use client'

import { useEffect, useState } from 'react'
import { Package, DollarSign, Clock, X } from 'lucide-react'
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
  userId: number
  totalPrice: number
  status: string
  rejectionReason: string | null
  createdAt: string
  user: {
    email: string
  }
  items: OrderItem[]
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await api.get<Order[]>('/api/orders/admin')
      setOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    if (status === 'CANCELLED' && !rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      await api.put(`/api/orders/admin/${orderId}/status`, { 
        status, 
        rejectionReason: status === 'CANCELLED' ? rejectReason : undefined 
      })
      await fetchData() // Refresh list
      closeOrderModal()
    } catch (e) {
      console.error(e)
    }
  }

  const closeOrderModal = () => {
    setSelectedOrder(null)
    setShowRejectInput(false)
    setRejectReason('')
  }

  if (loading) return <div className="animate-pulse text-zinc-500">Loading dashboard...</div>

  const totalRevenue = orders.filter(o => o.status === 'COMPLETED').reduce((acc, o) => acc + o.totalPrice, 0)
  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-2 mb-6 text-indigo-600 font-bold text-lg">
        <Package className="w-5 h-5" />
        Order Management
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Completed Revenue</p>
            <h3 className="text-2xl font-bold text-zinc-900">${(totalRevenue / 100).toFixed(2)}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Pending Orders</p>
            <h3 className="text-2xl font-bold text-zinc-900">{pendingOrdersCount}</h3>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-sm border-b border-zinc-200">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer Email</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Total Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No orders found.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">#{order.id}</td>
                    <td className="px-6 py-4 text-zinc-600">{order.user?.email || 'Unknown'}</td>
                    <td className="px-6 py-4 text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-zinc-600">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 font-medium text-zinc-900">${(order.totalPrice / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block
                        ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                        ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-medium text-xs transition-colors"
                      >
                        Review Order
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Review Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Review Order #{selectedOrder.id}</h2>
              <button onClick={closeOrderModal} className="text-zinc-500 hover:text-zinc-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-zinc-50">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-zinc-500">Customer Email</p>
                  <p className="font-bold text-zinc-900">{selectedOrder.user?.email || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Order Date</p>
                  <p className="font-bold text-zinc-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <h3 className="font-bold text-zinc-900 mb-4">Items Purchased</h3>
              <div className="space-y-4 mb-8">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4">
                    <img src={item.product?.imageUrl} className="w-16 h-16 rounded-xl object-cover bg-zinc-100" />
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900">{item.product?.name}</p>
                      <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-zinc-900">${((item.priceAtPurchase * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-zinc-200 pt-6 mb-6">
                <p className="text-lg font-bold text-zinc-900">Total Price</p>
                <p className="text-2xl font-bold text-zinc-900">${(selectedOrder.totalPrice / 100).toFixed(2)}</p>
              </div>

              {selectedOrder.rejectionReason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-bold text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{selectedOrder.rejectionReason}</p>
                </div>
              )}

              {showRejectInput && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Reason for Rejection</label>
                  <textarea 
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Provide a reason to the customer..."
                    className="w-full border border-zinc-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELLED')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm"
                    >
                      Confirm Rejection
                    </button>
                    <button 
                      onClick={() => setShowRejectInput(false)}
                      className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-bold rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-zinc-200 bg-white flex justify-end gap-3">
              {selectedOrder.status === 'PENDING' && !showRejectInput && (
                <>
                  <button 
                    onClick={() => setShowRejectInput(true)}
                    className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl"
                  >
                    Reject Order
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'PROCESSING')}
                    className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-500 font-bold rounded-xl"
                  >
                    Accept & Process
                  </button>
                </>
              )}
              {selectedOrder.status === 'PROCESSING' && (
                <div className="w-full text-center py-2 px-4 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm">
                  Waiting for customer to confirm receipt of order to complete it.
                </div>
              )}
              {selectedOrder.status === 'COMPLETED' && (
                <div className="w-full text-center py-2 px-4 bg-green-50 text-green-700 rounded-xl font-medium text-sm">
                  Order was successfully completed by the customer.
                </div>
              )}
              {selectedOrder.status === 'CANCELLED' && (
                <div className="w-full text-center py-2 px-4 bg-red-50 text-red-700 rounded-xl font-medium text-sm">
                  Order was rejected.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
