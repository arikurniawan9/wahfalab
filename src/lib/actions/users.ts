'use server'

import { createClient } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function getUsers(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where = search ? {
    OR: [
      { full_name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {}

  const [users, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    }),
    prisma.profile.count({ where })
  ])

  return { users, total, pages: Math.ceil(total / limit) }
}

export async function createOrUpdateUser(formData: any, id?: string) {
  const { email, password, full_name, role = 'operator' } = formData

  if (id) {
    // Update
    const updateData: any = { full_name, role }
    
    if (email || password) {
      const authUpdate: any = {}
      if (email) authUpdate.email = email
      if (password) authUpdate.password = password
      
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdate)
      if (authError) throw authError
      if (email) updateData.email = email
    }

    await prisma.profile.update({
      where: { id },
      data: updateData
    })
  } else {
    // Create
    let authUserId: string;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) {
      // Jika email sudah terdaftar di Auth, coba ambil ID-nya untuk sinkronisasi profil
      if (authError.message.includes('already been registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData.users.find(u => u.email === email);
        if (existingUser) {
          authUserId = existingUser.id;
        } else {
          throw authError;
        }
      } else {
        throw authError;
      }
    } else {
      authUserId = authUser.user.id;
    }

    // Upsert Profile
    await (prisma.profile as any).upsert({
      where: { id: authUserId },
      update: { full_name, role, email },
      create: {
        id: authUserId,
        full_name,
        role,
        email
      }
    })
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) throw error
  
  await prisma.profile.delete({ where: { id } })
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteManyUsers(ids: string[]) {
  // Delete from Auth first
  for (const id of ids) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  
  await prisma.profile.deleteMany({
    where: { id: { in: ids } }
  })
  revalidatePath('/admin/users')
  return { success: true }
}

export async function getClients() {
  return await prisma.profile.findMany({
    where: { role: 'client' },
    select: { id: true, full_name: true, company_name: true },
    orderBy: { full_name: 'asc' }
  })
}
