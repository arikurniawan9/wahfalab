import { PrismaClient } from './src/generated/prisma'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env', override: true })
dotenv.config({ path: '.env.local', override: true })

const prisma = new PrismaClient()

async function debugLogin() {
  const email = 'admin@wahfalab.com'
  const password = 'admin123'
  
  console.log(`--- DEBUG LOGIN SIMULATION ---`)
  console.log(`Email: ${email}`)
  console.log(`Password input: ${password}`)

  try {
    const user = await prisma.profile.findUnique({
      where: { email }
    })

    if (!user) {
      console.error('ERROR: User not found in database')
      return
    }

    console.log(`User found in DB: ${user.email}`)
    console.log(`Role in DB: ${user.role}`)
    
    const passwordHash = (user as any).password
    if (!passwordHash) {
      console.error('ERROR: Password hash is EMPTY in database')
      return
    }

    console.log(`Password Hash in DB: ${passwordHash}`)

    const isValid = await bcrypt.compare(password, passwordHash)
    console.log(`Bcrypt compare result: ${isValid}`)

    if (isValid) {
      console.log('✅ SUCCESS: Logic is CORRECT. If login still fails in browser, it might be an Auth.js session/cookie issue.')
    } else {
      console.error('❌ FAILED: Password comparison failed. Hash is not for this password.')
    }
  } catch (error) {
    console.error('DATABASE ERROR:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugLogin()
