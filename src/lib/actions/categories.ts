'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/utils/error-handler'
import { categorySchema, updateCategorySchema, type CategoryInput } from '@/lib/validations'
import { requireActionRole } from '@/lib/actions/action-guard'

/**
 * Get categories with pagination and search
 */
export async function getCategories(page = 1, limit = 10, search = "") {
  try {
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
  } catch (error) {
    handleError(error, { action: 'fetch', title: 'Gagal memuat kategori' })
    return { items: [], total: 0, pages: 0 }
  }
}

import { getCachedAllCategories, invalidateGlobalCache } from "@/lib/cache"

/**
 * Get all categories (for dropdowns)
 */
export async function getAllCategories() {
  return await getCachedAllCategories()
}

/**
 * Get single category by ID
 */
export async function getCategoryById(id: string) {
  try {
    return await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })
  } catch (error) {
    handleError(error, { action: 'fetch', title: 'Gagal memuat detail kategori' })
    return null
  }
}

/**
 * Create new category
 */
export async function createCategory(input: CategoryInput) {
  try {
    await requireActionRole(['admin', 'operator'])

    // Validate input
    const validated = categorySchema.parse(input)

    // Check for duplicate name
    const existing = await prisma.serviceCategory.findFirst({
      where: { name: { equals: validated.name, mode: 'insensitive' } }
    })

    if (existing) {
      throw new Error('Nama kategori sudah digunakan')
    }

    const category = await prisma.serviceCategory.create({
      data: {
        name: validated.name
      }
    })

    await invalidateGlobalCache("all_categories")
    revalidatePath('/admin/categories')
    revalidatePath('/operator/categories')
    return { success: true, data: category }
  } catch (error) {
    handleError(error, { action: 'create', title: 'Gagal menambahkan kategori' })
    return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' }
  }
}

/**
 * Update existing category
 */
export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  try {
    await requireActionRole(['admin', 'operator'])

    // Validate partial input
    const validated = updateCategorySchema.parse(input)

    // Check if category exists
    const existing = await prisma.serviceCategory.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('Kategori tidak ditemukan')
    }

    // Check for duplicate name (if name is being updated)
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.serviceCategory.findFirst({
        where: { 
          name: { equals: validated.name, mode: 'insensitive' },
          id: { not: id }
        }
      })

      if (duplicate) {
        throw new Error('Nama kategori sudah digunakan')
      }
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name: validated.name
      }
    })

    await invalidateGlobalCache("all_categories")
    revalidatePath('/admin/categories')
    revalidatePath('/operator/categories')
    return { success: true, data: category }
  } catch (error) {
    handleError(error, { action: 'update', title: 'Gagal memperbarui kategori' })
    return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' }
  }
}

/**
 * Delete single category
 */
export async function deleteCategory(id: string) {
  try {
    await requireActionRole(['admin', 'operator'])

    // Check if category exists and has no services
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { services: true } } }
    })

    if (!category) {
      throw new Error('Kategori tidak ditemukan')
    }

    if (category._count.services > 0) {
      throw new Error('Tidak dapat menghapus kategori yang masih memiliki layanan')
    }

    await prisma.serviceCategory.delete({
      where: { id }
    })

    await invalidateGlobalCache("all_categories")
    revalidatePath('/admin/categories')
    revalidatePath('/operator/categories')
    return { success: true }
  } catch (error) {
    handleError(error, { action: 'delete', title: 'Gagal menghapus kategori' })
    return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' }
  }
}

/**
 * Delete multiple categories
 */
export async function deleteManyCategories(ids: string[]) {
  try {
    await requireActionRole(['admin', 'operator'])

    if (!ids || ids.length === 0) {
      throw new Error('Pilih kategori yang akan dihapus')
    }

    // Check for categories with services
    const categories = await prisma.serviceCategory.findMany({
      where: { id: { in: ids } },
      include: { _count: { select: { services: true } } }
    })

    const withServices = categories.filter((c: any) => c._count.services > 0)
    if (withServices.length > 0) {
      throw new Error(
        `${withServices.length} kategori tidak dapat dihapus karena masih memiliki layanan`
      )
    }

    await prisma.serviceCategory.deleteMany({
      where: { id: { in: ids } }
    })

    await invalidateGlobalCache("all_categories")
    revalidatePath('/admin/categories')
    revalidatePath('/operator/categories')
    return { success: true }
  } catch (error) {
    handleError(error, { action: 'delete', title: 'Gagal menghapus kategori' })
    return { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' }
  }
}

/**
 * Backward compatibility - DEPRECATED
 * Use createCategory or updateCategory instead
 */
export async function createOrUpdateCategory(formData: any, id?: string) {
  if (id) {
    return await updateCategory(id, formData);
  } else {
    return await createCategory(formData);
  }
}
