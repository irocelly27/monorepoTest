import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { productsRoutes } from './routes/products'
import { cartRoutes } from './routes/cart'
import { orderRoutes } from './routes/orders'
import { reviewRoutes } from './routes/reviews'
import { usersRoutes } from './routes/users'
import { db } from './db'

const app = new Hono<{ Variables: { user: any } }>()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Basic routes
app.get('/', (c) => {
  return c.json({ message: 'Welcome to the Marketplace API' })
})

// Serve static uploads
app.use('/uploads/*', serveStatic({ root: './' }))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/cart', cartRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/reviews', reviewRoutes)
app.route('/api/users', usersRoutes)

export default app

app.get('/test', (c) => {
  return c.json({ ok: true })
})
