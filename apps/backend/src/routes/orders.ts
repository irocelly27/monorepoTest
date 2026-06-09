import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { carts, cartItems, orders, orderItems, products, users } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const orderRoutes = new Hono()

orderRoutes.use('*', authMiddleware)

// Checkout
orderRoutes.post('/checkout', async (c) => {
  const user = c.get('user')

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, user.id),
  })

  if (!cart) return c.json({ error: 'Cart not found' }, 404)

  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      price: products.price
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id))

  if (items.length === 0) return c.json({ error: 'Cart is empty' }, 400)

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Create Order
  const [newOrder] = await db.insert(orders).values({
    userId: user.id,
    totalPrice,
    status: 'PENDING'
  }).returning()

  // Create Order Items
  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.price
    })
  }

  // Clear Cart
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))

  return c.json({ message: 'Checkout successful', orderId: newOrder.id })
})

// Get my orders
orderRoutes.get('/me', async (c) => {
  const user = c.get('user')

  const myOrders = await db.query.orders.findMany({
    where: eq(orders.userId, user.id),
    orderBy: [desc(orders.createdAt)]
  })

  // Enhance with items
  const ordersWithItems = await Promise.all(myOrders.map(async (order) => {
    const items = await db
      .select({
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        product: products
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id))
    return { ...order, items }
  }))

  return c.json(ordersWithItems)
})

// Admin: Get all orders
orderRoutes.get('/admin', async (c) => {
  const user = c.get('user')
  if (user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)

  const allOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      totalPrice: orders.totalPrice,
      status: orders.status,
      rejectionReason: orders.rejectionReason,
      createdAt: orders.createdAt,
      user: {
        email: users.email
      }
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))

  // Enhance with items
  const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
    const items = await db
      .select({
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        product: products
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id))
    return { ...order, items }
  }))
  
  return c.json(ordersWithItems)
})

// Admin: Update order status
const statusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'CANCELLED']), // Admin cannot COMPLETED
  rejectionReason: z.string().optional()
})

orderRoutes.put('/admin/:id/status', zValidator('json', statusSchema), async (c) => {
  const user = c.get('user')
  if (user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)

  const orderId = parseInt(c.req.param('id'))
  const { status, rejectionReason } = c.req.valid('json')

  if (status === 'CANCELLED' && !rejectionReason) {
    return c.json({ error: 'Rejection reason is required when cancelling an order' }, 400)
  }

  await db.update(orders)
    .set({ 
      status, 
      rejectionReason: status === 'CANCELLED' ? rejectionReason : null 
    })
    .where(eq(orders.id, orderId))

  return c.json({ message: 'Order status updated' })
})

// User: Complete Order
orderRoutes.put('/me/:id/complete', async (c) => {
  const user = c.get('user')
  const orderId = parseInt(c.req.param('id'))

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  })

  if (!order || order.userId !== user.id) {
    return c.json({ error: 'Order not found' }, 404)
  }

  if (order.status !== 'PROCESSING') {
    return c.json({ error: 'Order cannot be completed' }, 400)
  }

  await db.update(orders)
    .set({ status: 'COMPLETED' })
    .where(eq(orders.id, orderId))

  return c.json({ message: 'Order completed successfully' })
})
