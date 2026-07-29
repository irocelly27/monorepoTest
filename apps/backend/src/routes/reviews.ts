import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { reviews, orders, orderItems } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const reviewRoutes = new Hono<{ Variables: { user: any } }>()

const reviewSchema = z.object({
  productId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

reviewRoutes.post('/', authMiddleware, zValidator('json', reviewSchema), async (c) => {
  const user = c.get('user')
  const { productId, rating, comment } = c.req.valid('json')

  // Check if user has purchased this product
  const userOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.userId, user.id), eq(orderItems.productId, productId)))

  if (userOrders.length === 0) {
    return c.json({ error: 'You can only review products you have purchased.' }, 403)
  }

  // Check if they already reviewed it
  const existingReview = await db.query.reviews.findFirst({
    where: and(eq(reviews.userId, user.id), eq(reviews.productId, productId))
  })

  if (existingReview) {
    return c.json({ error: 'You have already reviewed this product.' }, 400)
  }

  await db.insert(reviews).values({
    userId: user.id,
    productId,
    rating,
    comment
  })

  return c.json({ message: 'Review added successfully' })
})
