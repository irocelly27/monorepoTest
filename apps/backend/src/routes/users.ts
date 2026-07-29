import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { users, orders, orderItems, products } from '../db/schema'
import { authMiddleware } from '../middleware/auth'

export const usersRoutes = new Hono<{ Variables: { user: any } }>()

// Middleware to check for ADMIN role
const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user')
  if (!user || user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
}

usersRoutes.use('*', authMiddleware, requireAdmin)

// Get all users
usersRoutes.get('/', async (c) => {
  try {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      columns: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })
    return c.json({ users: allUsers })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get single user with orders
usersRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ error: 'Invalid user ID' }, 400)
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Fetch user's orders
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, id),
      orderBy: [desc(orders.createdAt)]
    })

    // Enhance with items
    const ordersWithItems = await Promise.all(userOrders.map(async (order) => {
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

    return c.json({ 
      user, 
      orders: ordersWithItems 
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
