'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function getServices(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { category_ref: { name: { contains: search, mode: 'insensitive' as const } } },
    ]
  } : {}

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { category_ref: true }
    }),
    prisma.service.count({ where })
  ])

  return serializeData({ items, total, pages: Math.ceil(total / limit) })
}

export async function createOrUpdateService(formData: any, id?: string) {
  let parsedParameters = null;
  
  if (formData.parameters) {
    try {
      parsedParameters = JSON.parse(formData.parameters);
    } catch (e) {
      parsedParameters = formData.parameters;
    }
  }

  const data = {
    category_id: formData.category_id,
    name: formData.name,
    price: formData.price,
    unit: formData.unit,
    regulation: formData.regulation,
    parameters: parsedParameters,
  }

  if (id) {
    await prisma.service.update({
      where: { id },
      data
    })
  } else {
    await (prisma.service as any).create({
      data
    })
  }

  revalidatePath('/admin/services')
  return { success: true }
}

export async function deleteService(id: string) {
  await prisma.service.delete({
    where: { id }
  })
  revalidatePath('/admin/services')
  return { success: true }
}

export async function deleteManyServices(ids: string[]) {
  await prisma.service.deleteMany({
    where: { id: { in: ids } }
  })
  revalidatePath('/admin/services')
  return { success: true }
}

export async function getAllServices() {
  const services = await prisma.service.findMany({
    include: { category_ref: true },
    orderBy: { name: 'asc' }
  })
  
  return serializeData(services)
}
