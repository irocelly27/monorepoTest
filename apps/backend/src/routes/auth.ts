import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'

export const authRoutes = new Hono<{ Variables: { user: any } }>()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Register
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 400)
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      role: 'USER',
    }).returning({ id: users.id, email: users.email, role: users.role })

    return c.json({ message: 'User created', user: newUser }, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    return c.json({ token, user: { id: user.id, email: user.email, role: user.role } })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get current user (Me)
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return c.json({ user: { id: decoded.id, email: decoded.email, role: decoded.role } })
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
