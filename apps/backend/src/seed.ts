import { db } from './db'
import { users, products, carts, cartItems, orders, orderItems, reviews } from './db/schema'
import * as bcrypt from 'bcrypt'

const seed = async () => {
  console.log('Seeding database...')

  try {
    // 1. Clear existing data (in correct order to respect foreign keys)
    await db.delete(reviews)
    await db.delete(orderItems)
    await db.delete(orders)
    await db.delete(cartItems)
    await db.delete(carts)
    await db.delete(products)
    await db.delete(users)

    // 2. Create Admin User
    const adminPasswordHash = await bcrypt.hash('admin123', 10)
    await db.insert(users).values({
      email: 'admin@marketplace.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    })

    console.log('Created admin user: admin@marketplace.local (password: admin123)')

    // 3. Create dummy products
    const dummyProducts = [
      { name: 'Premium Wireless Headphones', price: 29900, description: 'High quality headphones', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', tag: 'Bestseller' },
      { name: 'Mechanical Keyboard Pro', price: 15900, description: 'RGB keyboard', imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=600&q=80', tag: 'New' },
      { name: 'Smart Fitness Watch', price: 19900, description: 'Track your health', imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80', tag: 'Trending' },
      { name: 'Ultra-slim Laptop Stand', price: 4900, description: 'Ergonomic stand', imageUrl: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=600&q=80', tag: null },
      { name: 'Noise-cancelling Earbuds', price: 14900, description: 'Silence the world', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80', tag: null },
      { name: '4K Monitor Curved', price: 49900, description: 'Immersive display', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80', tag: 'Premium' },
    ]

    await db.insert(products).values(dummyProducts)
    console.log('Created dummy products')

    console.log('Seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seed()
