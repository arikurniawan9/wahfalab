import { PrismaClient } from '../generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

const prismaClientSingleton = () => {
  const databaseUrl =
    process.env.APP_DATABASE_URL ||
    process.env.NEXT_PUBLIC_APP_DATABASE_URL ||
    process.env.DATABASE_URL ||
    ''

  const client = new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  if (databaseUrl.startsWith('prisma+postgres://')) {
    return client.$extends(withAccelerate())
  }

  return client
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
