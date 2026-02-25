'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function getOperationalCatalogs(page = 1, limit = 20, search = "", category?: string) {
  const skip = (page - 1) * limit
  const where: any = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } },
      { location: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (category) {
    where.category = category
  }

  const [items, total] = await Promise.all([
    prisma.operationalCatalog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    }),
    prisma.operationalCatalog.count({ where })
  ])

  return serializeData({
    items,
    total,
    pages: Math.ceil(total / limit)
  })
}

export async function createOperationalCatalog(formData: any) {
  try {
    await prisma.operationalCatalog.create({
      data: {
        category: formData.category,
        perdiem_type: formData.perdiem_type,
        location: formData.location,
        distance_category: formData.distance_category,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        unit: formData.unit,
      },
    })
    revalidatePath('/admin/transport-costs')
    return { success: true }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal menyimpan data')
  }
}

export async function updateOperationalCatalog(id: string, formData: any) {
  try {
    await prisma.operationalCatalog.update({
      where: { id },
      data: {
        category: formData.category,
        perdiem_type: formData.perdiem_type,
        location: formData.location,
        distance_category: formData.distance_category,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        unit: formData.unit,
      },
    })
    revalidatePath('/admin/transport-costs')
    return { success: true }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal memperbarui data')
  }
}

export async function deleteOperationalCatalog(id: string) {
  try {
    await prisma.operationalCatalog.delete({
      where: { id }
    })
    revalidatePath('/admin/engineer-costs')
    return { success: true }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal menghapus data')
  }
}

export async function getOperationalCatalogById(id: string) {
  try {
    const catalog = await prisma.operationalCatalog.findUnique({
      where: { id }
    })
    return serializeData(catalog)
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Data tidak ditemukan')
  }
}

export async function getAllOperationalCatalogs() {
  const catalogs = await prisma.operationalCatalog.findMany({
    orderBy: { created_at: 'desc' }
  })
  return serializeData(catalogs)
}

export async function updatePrice(id: string, price: number) {
  try {
    await prisma.operationalCatalog.update({
      where: { id },
      data: { price }
    })
    revalidatePath('/admin/engineer-costs')
    revalidatePath('/admin/transport-costs')
    return { success: true }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal update harga')
  }
}

export async function updateLocation(id: string, location: string) {
  try {
    await prisma.operationalCatalog.update({
      where: { id },
      data: { location }
    })
    revalidatePath('/admin/engineer-costs')
    revalidatePath('/admin/transport-costs')
    return { success: true }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal update lokasi')
  }
}

export async function getHistory(catalogId: string) {
  try {
    const history = await prisma.operationalHistory.findMany({
      where: { catalog_id: catalogId },
      orderBy: { changed_at: 'desc' }
    })
    return serializeData(history)
  } catch (error) {
    console.error('Prisma Error:', error)
    return []
  }
}
