'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { hashPassword } from '@/lib/auth-helpers'

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
    const [users, total] = await Promise.all([
      prisma.profile.findMany({ 
        where, 
        skip, 
        take: limit, 
        orderBy: { created_at: 'desc' } 
      }),
      prisma.profile.count({ where })
    ]);

    return {
      users: serializeData(users),
      total,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error("GetUsers Error:", error);
    return { users: [], total: 0, pages: 0 };
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

      if (email) {
        updateData.email = email
      }

      if (password) {
        updateData.password = await hashPassword(password)
      }

      await prisma.profile.update({
        where: { id },
        data: updateData
      })
    } else {
      // Create
      // Cek apakah email sudah ada
      const existingUser = await prisma.profile.findUnique({
        where: { email }
      })

      if (existingUser) {
        return { error: 'Email sudah terdaftar' }
      }

      const hashedPassword = await hashPassword(password)

      await prisma.profile.create({
        data: {
          full_name,
          role,
          email,
          password: hashedPassword,
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
    await prisma.profile.delete({ where: { id } })
    revalidatePath('/admin/users')
    revalidatePath('/admin/customers')
    return { success: true }
  } catch (err: any) {
    console.error("Delete User Error:", err)
    return { error: err.message }
  }
}

export async function deleteManyUsers(ids: string[]) {
  try {
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
