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

export async function getUsers(page = 1, limit = 10) {
  const skip = (page - 1) * limit
  const [users, total] = await Promise.all([
    prisma.profile.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    }),
    prisma.profile.count()
  ])

  return { users, total, pages: Math.ceil(total / limit) }
}

export async function createOrUpdateUser(formData: any, id?: string) {
  const { email, password, full_name, role } = formData

  if (id) {
    // Update
    const updateData: any = { full_name, role }
    
    // Update Auth if needed (email/password)
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
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) throw authError

    await prisma.profile.upsert({
      where: { id: authUser.user.id },
      update: { full_name, role, email },
      create: {
        id: authUser.user.id,
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
