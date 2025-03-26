// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'


const prisma = new PrismaClient()

const users = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "bacon"
  },
  {
    name: "antoine",
    email: "ant@sxbn.org",
    password: "bacon"
  }
]

async function main() {
  console.log(`Start seeding ...`)
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        email: user.email,
        password: await bcrypt.hash(user.password, 10)
      },
      create: {
        name: user.name,
        email: user.email,
        password: await bcrypt.hash(user.password, 10)
      }
    });
  }
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
