import { PrismaClient } from './generated/prisma';
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env', override: true })
dotenv.config({ path: '.env.local', override: true })

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany();
  console.log(JSON.stringify(profiles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
