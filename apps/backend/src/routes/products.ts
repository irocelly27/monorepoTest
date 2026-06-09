import { Hono } from 'hono'
import { eq, desc, asc, ilike, and, gte, lte, inArray } from 'drizzle-orm'
import { db } from '../db'
import { products, reviews, users } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import * as fs from 'fs'
import * as path from 'path'

export const productsRoutes = new Hono()

// Get all products
productsRoutes.get('/', async (c) => {
  const { q, minPrice, maxPrice, sort } = c.req.query()
  const tags = c.req.queries('tag') // supports multiple ?tag=...&tag=...
  
  const conditions = []
  
  if (q) {
    conditions.push(ilike(products.name, `%${q}%`))
  }
  if (minPrice) {
    conditions.push(gte(products.price, parseInt(minPrice)))
  }
  if (maxPrice) {
    conditions.push(lte(products.price, parseInt(maxPrice)))
  }
  if (tags && tags.length > 0) {
    conditions.push(inArray(products.tag, tags))
  }

  let orderByFilter = [desc(products.createdAt)]
  if (sort === 'price_asc') {
    orderByFilter = [asc(products.price)]
  } else if (sort === 'price_desc') {
    orderByFilter = [desc(products.price)]
  }

  const allProducts = await db.query.products.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: orderByFilter
  })
  return c.json(allProducts)
})

// Get single product with reviews
productsRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const product = await db.query.products.findFirst({
    where: eq(products.id, id)
  })

  if (!product) return c.json({ error: 'Product not found' }, 404)

  const productReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      user: {
        email: users.email
      }
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt))

  return c.json({ ...product, reviews: productReviews })
})

// ADMIN ROUTES BELOW

// Create Product
productsRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  if (user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.parseBody()
  
  const name = body.name as string
  const description = body.description as string || null
  const price = parseFloat(body.price as string)
  const tag = body.tag as string || null
  let imageUrl: string | null = null

  if (body.image instanceof File) {
    const file = body.image
    const extension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
    const uploadPath = path.join(process.cwd(), 'uploads', fileName)
    const arrayBuffer = await file.arrayBuffer()
    await fs.promises.writeFile(uploadPath, Buffer.from(arrayBuffer))
    imageUrl = `/uploads/${fileName}`
  }

  const [newProduct] = await db.insert(products).values({
    name,
    description,
    price,
    imageUrl,
    tag,
  }).returning()

  return c.json(newProduct, 201)
})

// Update Product
productsRoutes.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  if (user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)

  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.parseBody()

  const name = body.name as string
  const description = body.description as string || null
  const price = parseFloat(body.price as string)
  const tag = body.tag as string || null
  let newImageUrl: string | null = null

  if (body.image instanceof File) {
    const file = body.image
    const extension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
    const uploadPath = path.join(process.cwd(), 'uploads', fileName)
    const arrayBuffer = await file.arrayBuffer()
    await fs.promises.writeFile(uploadPath, Buffer.from(arrayBuffer))
    newImageUrl = `/uploads/${fileName}`
  }

  const updateData: any = {
    name,
    description,
    price,
    tag,
  }
  if (newImageUrl) {
    updateData.imageUrl = newImageUrl
  }

  const [updatedProduct] = await db.update(products).set(updateData).where(eq(products.id, id)).returning()

  if (!updatedProduct) return c.json({ error: 'Product not found' }, 404)

  return c.json(updatedProduct)
})

// Delete Product
productsRoutes.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  if (user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)

  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  // This will fail if there are foreign key constraints (like orders or reviews attached).
  // Ideally, we'd soft delete or handle cascade, but for this demo we'll just attempt delete.
  try {
    await db.delete(products).where(eq(products.id, id))
    return c.json({ message: 'Product deleted' })
  } catch (error: any) {
    return c.json({ error: 'Cannot delete product. It may be linked to existing orders or reviews.' }, 400)
  }
})
