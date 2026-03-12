
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Keys on prisma object:', Object.keys(prisma).filter(k => !k.startsWith('_')))
    const count = await prisma.schoolDocument.count().catch(err => {
        console.log('Error calling count on schoolDocument:', err.message)
        return -1
    })
    console.log('Count:', count)
  } catch (err) {
    console.error('Outer error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
