'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function getServices(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where: any = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { category_ref: { name: { contains: search, mode: 'insensitive' as const } } },
      { regulation_ref: { name: { contains: search, mode: 'insensitive' as const } } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { 
        category_ref: true,
        regulation_ref: {
          select: { id: true, name: true, code: true }
        }
      }
    }),
    prisma.service.count({ where })
  ])

  return serializeData({ items, total, pages: Math.ceil(total / limit) })
}

export async function createOrUpdateService(formData: any, id?: string) {
  try {
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
      regulation_id: formData.regulation_id || null,
      name: formData.name,
      price: formData.price,
      unit: formData.unit,
      regulation: formData.regulation, // Keep this for legacy compatibility
      parameters: parsedParameters,
    }

    if (id) {
      await prisma.service.update({
        where: { id },
        data
      })
    } else {
      await prisma.service.create({
        data
      })
    }

    revalidatePath('/admin/services')
    return { success: true }
  } catch (error: any) {
    console.error('Service Action Error:', error)
    return { success: false, error: error.message || 'Gagal menyimpan data' }
  }
}

export async function updateServiceParameters(id: string, parameters: string[]) {
  try {
    const parsedParameters = parameters.map(p => ({ name: p }));
    await prisma.service.update({
      where: { id },
      data: {
        parameters: parsedParameters,
      }
    });
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal update parameter' };
  }
}

export async function deleteService(id: string) {
  try {
    await prisma.service.delete({
      where: { id }
    })
    revalidatePath('/admin/services')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus data' }
  }
}

export async function deleteManyServices(ids: string[]) {
  try {
    await prisma.service.deleteMany({
      where: { id: { in: ids } }
    })
    revalidatePath('/admin/services')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus beberapa data' }
  }
}

export async function getAllServices() {
  const services = await prisma.service.findMany({
    include: { 
      category_ref: true,
      regulation_ref: { select: { name: true } }
    },
    orderBy: { name: 'asc' }
  })
  
  return serializeData(services)
}
