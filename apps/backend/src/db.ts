import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import * as schema from './db/schema'

dotenv.config()

export const client = postgres(process.env.DATABASE_URL as string, {
  prepare: false,
  ssl: 'require',
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
