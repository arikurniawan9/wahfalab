'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCategories(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where = search ? {
    name: { contains: search, mode: 'insensitive' as const }
  } : {}

  const [items, total] = await Promise.all([
    prisma.serviceCategory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { services: true } } }
    }),
    prisma.serviceCategory.count({ where })
  ])

  return { items, total, pages: Math.ceil(total / limit) }
}

export async function getAllCategories() {
  return await prisma.serviceCategory.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createOrUpdateCategory(formData: any, id?: string) {
  const data = { name: formData.name }

  if (id) {
    await prisma.serviceCategory.update({
      where: { id },
      data
    })
  } else {
    await prisma.serviceCategory.create({
      data
    })
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteCategory(id: string) {
  await prisma.serviceCategory.delete({
    where: { id }
  })
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteManyCategories(ids: string[]) {
  await prisma.serviceCategory.deleteMany({
    where: { id: { in: ids } }
  })
  revalidatePath('/admin/categories')
  return { success: true }
}
