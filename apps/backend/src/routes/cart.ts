import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { carts, cartItems, products } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const cartRoutes = new Hono<{ Variables: { user: any } }>()

cartRoutes.use('*', authMiddleware)

// Get cart
cartRoutes.get('/', async (c) => {
  const user = c.get('user')
  
  let cart = await db.query.carts.findFirst({
    where: eq(carts.userId, user.id),
  })

  if (!cart) {
    const [newCart] = await db.insert(carts).values({ userId: user.id }).returning()
    cart = newCart
  }

  // We need to fetch the products manually if relations are not strictly defined, 
  // but let's assume we can join or query them
  // Actually drizzle doesn't automatically join unless relations are defined. 
  // Let's do a manual join approach for safety since relations aren't defined in schema.ts
  const cartItemsWithProducts = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      product: products
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id))

  return c.json({ cart, items: cartItemsWithProducts })
})

const addSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1)
})

// Add to cart
cartRoutes.post('/add', zValidator('json', addSchema), async (c) => {
  const user = c.get('user')
  const { productId, quantity } = c.req.valid('json')

  let cart = await db.query.carts.findFirst({
    where: eq(carts.userId, user.id),
  })

  if (!cart) {
    const [newCart] = await db.insert(carts).values({ userId: user.id }).returning()
    cart = newCart
  }

  // Check if item exists in cart
  const existingItem = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId))
  })

  if (existingItem) {
    await db.update(cartItems)
      .set({ quantity: existingItem.quantity + quantity })
      .where(eq(cartItems.id, existingItem.id))
  } else {
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId,
      quantity
    })
  }

  return c.json({ message: 'Added to cart' })
})

// Remove from cart
cartRoutes.delete('/item/:id', async (c) => {
  const user = c.get('user')
  const itemId = parseInt(c.req.param('id'))

  // Verify ownership
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, user.id),
  })

  if (!cart) return c.json({ error: 'Cart not found' }, 404)

  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))

  return c.json({ message: 'Item removed' })
})
