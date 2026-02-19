'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function getEquipment(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { category: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {}

  const [items, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.equipment.count({ where })
  ])

  return serializeData({ items, total, pages: Math.ceil(total / limit) })
}

export async function createOrUpdateEquipment(formData: any, id?: string) {
  const data = {
    name: formData.name,
    category: formData.category,
    specification: formData.specification,
    price: formData.price,
    unit: formData.unit || 'unit',
    availability_status: formData.availability_status || 'available',
    quantity: parseInt(formData.quantity) || 0,
    description: formData.description,
    image_url: formData.image_url,
  }

  if (id) {
    await prisma.equipment.update({
      where: { id },
      data
    })
  } else {
    await (prisma.equipment as any).create({
      data
    })
  }

  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function deleteEquipment(id: string) {
  await prisma.equipment.delete({
    where: { id }
  })
  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function deleteManyEquipment(ids: string[]) {
  await prisma.equipment.deleteMany({
    where: { id: { in: ids } }
  })
  revalidatePath('/admin/equipment')
  return { success: true }
}

export async function getAllEquipment() {
  const equipment = await prisma.equipment.findMany({
    orderBy: { name: 'asc' }
  })

  return serializeData(equipment)
}
