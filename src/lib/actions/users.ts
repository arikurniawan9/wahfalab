'use server'

import { createClient } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

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

export async function getUsers(page = 1, limit = 10, search = "", role?: string, notRole?: string) {
  const skip = (page - 1) * limit
  const where: any = {}
  
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { company_name: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (role && role !== 'all') {
    where.role = role
  }

  if (notRole) {
    where.role = { not: notRole }
  }

  try {
    const [prismaResult, authResult] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      supabaseAdmin.auth.admin.listUsers(),
      prisma.profile.count({ where })
    ]);

    const users = prismaResult;
    const total = await prisma.profile.count({ where });
    const authUsers = authResult.data.users;

    const mergedUsers = users.map(user => {
      const authUser = authUsers.find(au => au.id === user.id);
      return {
        ...user,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        is_online: authUser?.last_sign_in_at 
          ? (new Date().getTime() - new Date(authUser.last_sign_in_at).getTime()) < 3600000 
          : false
      };
    });

    return { 
      users: serializeData(mergedUsers), 
      total, 
      pages: Math.ceil(total / limit) 
    };
  } catch (error) {
    console.error("GetUsers Error:", error);
    const [users, total] = await Promise.all([
      prisma.profile.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.profile.count({ where })
    ]);
    return { users: serializeData(users), total, pages: Math.ceil(total / limit) };
  }
}

export async function createOrUpdateUser(formData: any, id?: string) {
  if (!formData) {
    return { error: 'Form data tidak valid' }
  }

  const { email, password, full_name, role = 'operator', company_name, address, phone } = formData

  try {
    if (id) {
      // Update
      const updateData: any = { full_name, role, company_name, address, phone }
      
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

      await (prisma.profile as any).upsert({
        where: { id: authUserId },
        update: { full_name, role, email, company_name, address, phone },
        create: {
          id: authUserId,
          full_name,
          role,
          email,
          company_name,
          address,
          phone
        }
      })
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (error: any) {
    console.error("Create/Update User Error:", error);
    return { error: error.message || "Gagal menyimpan data" }
  }
}

export async function deleteUser(id: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error && !error.message.toLowerCase().includes('not found')) {
      throw error
    }
    
    await prisma.profile.delete({ where: { id } })
    revalidatePath('/admin/users')
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (err: any) {
    console.error("Delete Single User Error:", err)
    try {
      await prisma.profile.delete({ where: { id } })
      revalidatePath('/admin/users')
      revalidatePath('/admin/customers')
      return { success: true }
    } catch (prismaErr) {
      return { error: err.message }
    }
  }
}

export async function deleteManyUsers(ids: string[]) {
  try {
    for (const id of ids) {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (error && !error.message.toLowerCase().includes('not found')) {
          console.warn(`Warning: Could not delete user ${id} from auth:`, error.message)
        }
      } catch (e) {
        console.error(`Error deleting user ${id} from auth:`, e)
      }
    }
    
    await prisma.profile.deleteMany({
      where: { id: { in: ids } }
    })
    revalidatePath('/admin/users')
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function getClients() {
  try {
    const clients = await prisma.profile.findMany({
      where: { role: 'client' },
      select: { id: true, full_name: true, company_name: true, email: true },
      orderBy: { full_name: 'asc' }
    })
    return serializeData(clients)
  } catch (error) {
    return []
  }
}
