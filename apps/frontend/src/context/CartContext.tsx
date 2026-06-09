'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/lib/api'

type CartItem = {
  id: number
  quantity: number
  product: {
    id: number
    name: string
    price: number
    imageUrl: string
  }
}

type CartContextType = {
  items: CartItem[]
  addToCart: (productId: number, quantity?: number) => Promise<void>
  removeFromCart: (itemId: number) => Promise<void>
  clearCart: () => void
  fetchCart: () => Promise<void>
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const fetchCart = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return

    try {
      const data = await api.get<{items: CartItem[]}>('/api/cart')
      setItems(data.items || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const addToCart = async (productId: number, quantity = 1) => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      await api.post('/api/cart/add', { productId, quantity })
      await fetchCart()
    } catch (e) {
      console.error(e)
    }
  }

  const removeFromCart = async (itemId: number) => {
    try {
      await api.delete(`/api/cart/item/${itemId}`)
      await fetchCart()
    } catch (e) {
      console.error(e)
    }
  }

  const clearCart = () => {
    setItems([])
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, fetchCart, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
