import { withAccelerate } from '@prisma/extension-accelerate'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

const PRISMA_CLIENT_VERSION = '2026-04-25-upload-storage-v2'

if (process.env.NODE_ENV !== 'production') {
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true })
  }
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true })
  }
}

// Force a fresh load of the generated Prisma client so schema changes are picked up
// even if the dev server keeps module cache around between hot reloads.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const generatedPrismaPath = require.resolve('../generated/prisma')
delete require.cache[generatedPrismaPath]
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../generated/prisma') as typeof import('../generated/prisma')

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL || ''

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
  var prismaClientVersion: string | undefined
}

const prisma =
  globalThis.prisma && globalThis.prismaClientVersion === PRISMA_CLIENT_VERSION
    ? globalThis.prisma
    : prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
  globalThis.prismaClientVersion = PRISMA_CLIENT_VERSION
}
