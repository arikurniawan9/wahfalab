/**
 * Seed script untuk WahfaLab
 * 
 * Usage:
 * npx tsx prisma/seed-admin.ts
 * 
 * Script ini akan:
 * 1. Reset database (delete all data)
 * 2. Create admin user via Supabase Auth
 * 3. Create admin profile
 * 4. Create company profile
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================
  // 1. RESET DATABASE
  // ============================================
  console.log('🗑️  Resetting database...');
  
  // Delete in correct order (child tables first, then parent tables)
  await prisma.labAnalysis.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.travelOrder.deleteMany();
  await prisma.samplingAssignment.deleteMany();
  await prisma.jobOrder.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.operationalHistory.deleteMany();
  await prisma.operationalCatalog.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.profile.deleteMany();
  
  console.log('✅ Database reset complete\n');

  // ============================================
  // 2. CREATE ADMIN USER VIA SUPABASE AUTH
  // ============================================
  console.log('👤 Creating admin user...');
  
  const adminEmail = 'admin@wahfalab.com';
  const adminPassword = 'admin123456'; // Default password
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Administrator',
      role: 'admin'
    }
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError.message);
    console.log('⚠️  User might already exist, continuing...\n');
  } else {
    console.log('✅ Admin auth user created');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ID: ${authData.user.id}\n`);
  }

  // Get the user ID from existing profile or use the new auth user ID
  let adminUserId = authData?.user?.id;

  if (!adminUserId) {
    // Try to find existing admin profile
    const existingAdmin = await prisma.profile.findFirst({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      adminUserId = existingAdmin.id;
      console.log('✅ Using existing admin user');
      console.log(`   ID: ${adminUserId}\n`);
    }
  }

  if (!adminUserId) {
    // If still no ID, sign in to get the user
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    adminUserId = signInData?.user?.id;
  }

  if (!adminUserId) {
    console.error('❌ Could not get admin user ID');
    return;
  }

  // ============================================
  // 3. CREATE ADMIN PROFILE
  // ============================================
  console.log('📝 Creating admin profile...');
  
  await prisma.profile.upsert({
    where: { id: adminUserId },
    update: {
      email: adminEmail,
      full_name: 'Administrator',
      role: 'admin'
    },
    create: {
      id: adminUserId,
      email: adminEmail,
      full_name: 'Administrator',
      role: 'admin'
    }
  });

  console.log('✅ Admin profile created\n');

  // ============================================
  // 4. CREATE COMPANY PROFILE
  // ============================================
  console.log('🏢 Creating company profile...');
  
  await prisma.companyProfile.create({
    data: {
      company_name: 'WahfaLab',
      address: 'Jl. Laboratorium No. 123, Jakarta, Indonesia',
      phone: '(021) 1234-5678',
      whatsapp: '+62 812-3456-7890',
      email: 'info@wahfalab.com',
      website: 'https://wahfalab.com',
      tagline: 'Laboratorium Analisis & Kalibrasi',
      npwp: '00.000.000.0-000.000',
      logo_url: '/logo-wahfalab.png'
    }
  });

  console.log('✅ Company profile created\n');

  // ============================================
  // 5. VERIFICATION
  // ============================================
  console.log('📊 Verification:\n');
  
  const profileCount = await prisma.profile.count();
  const companyProfileCount = await prisma.companyProfile.count();
  const adminProfile = await prisma.profile.findFirst({
    where: { role: 'admin' },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true
    }
  });

  const companyProfile = await prisma.companyProfile.findFirst({
    select: {
      id: true,
      company_name: true,
      email: true,
      phone: true,
      tagline: true
    }
  });

  console.log('Profiles:', profileCount);
  console.log('Company Profiles:', companyProfileCount);
  console.log('\nAdmin Profile:');
  console.log(JSON.stringify(adminProfile, null, 2));
  console.log('\nCompany Profile:');
  console.log(JSON.stringify(companyProfile, null, 2));

  console.log('\n✅ Seed completed successfully!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('   Email: admin@wahfalab.com');
  console.log('   Password: admin123456');
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
