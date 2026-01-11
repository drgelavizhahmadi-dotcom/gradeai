// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Hash password for test user
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test Parent',
      phone: '+49 123 456789',
      language: 'de',
      hashedPassword,
      subscriptionStatus: 'free',
    },
  })

  console.log('Created test user:', user.email)

  // Create 2 test children
  const child1 = await prisma.child.create({
    data: {
      name: 'Max Mustermann',
      grade: 5,
      schoolType: 'Gymnasium',
      userId: user.id,
    },
  })

  console.log('Created child 1:', child1.name)

  const child2 = await prisma.child.create({
    data: {
      name: 'Anna Mustermann',
      grade: 8,
      schoolType: 'Realschule',
      userId: user.id,
    },
  })

  console.log('Created child 2:', child2.name)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
