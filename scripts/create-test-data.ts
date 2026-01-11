import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  // Create user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test Parent',
    }
  }) as any

  console.log('✓ Created user:', user.id)

  // Create child
  const child = await prisma.child.create({
    data: {
      name: 'Max Mustermann',
      grade: 7,
      schoolType: 'Gymnasium',
      userId: user.id,
    }
  })

  console.log('✓ Created child:', child.id)
  console.log('✓ Test data created successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
