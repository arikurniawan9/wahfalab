'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { handleError } from '@/lib/utils/error-handler'

/**
 * Get field assistants with pagination and search
 */
export async function getFieldAssistants(page = 1, limit = 10, search = "") {
  try {
    const skip = (page - 1) * limit
    const where = search ? {
      OR: [
        { full_name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    const [items, total] = await Promise.all([
      prisma.fieldAssistant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { full_name: 'asc' }
      }),
      prisma.fieldAssistant.count({ where })
    ])

    return { 
      items: serializeData(items), 
      total, 
      pages: Math.ceil(total / limit) 
    }
  } catch (error) {
    handleError(error, { action: 'fetch', title: 'Gagal memuat asisten' })
    return { items: [], total: 0, pages: 0 }
  }
}

/**
 * Get all field assistants (for dropdowns)
 */
export async function getAllFieldAssistants() {
  try {
    const assistants = await prisma.fieldAssistant.findMany({
      orderBy: { full_name: 'asc' }
    })
    return serializeData(assistants)
  } catch (error) {
    console.error('Error getting all field assistants:', error)
    return []
  }
}

/**
 * Create new field assistant
 */
export async function createFieldAssistant(data: {
  full_name: string
  phone?: string
  address?: string
  email?: string
}) {
  try {
    const assistant = await prisma.fieldAssistant.create({
      data
    })
    revalidatePath('/admin/assistants')
    revalidatePath('/operator/assistants')
    return { success: true, data: serializeData(assistant) }
  } catch (error: any) {
    handleError(error, { action: 'create', title: 'Gagal mendaftarkan asisten' })
    return { success: false, error: error.message }
  }
}

/**
 * Update existing field assistant
 */
export async function updateFieldAssistant(id: string, data: {
  full_name?: string
  phone?: string
  address?: string
  email?: string
}) {
  try {
    const assistant = await prisma.fieldAssistant.update({
      where: { id },
      data
    })
    revalidatePath('/admin/assistants')
    revalidatePath('/operator/assistants')
    return { success: true, data: serializeData(assistant) }
  } catch (error: any) {
    handleError(error, { action: 'update', title: 'Gagal memperbarui data asisten' })
    return { success: false, error: error.message }
  }
}

/**
 * Delete field assistant
 */
export async function deleteFieldAssistant(id: string) {
  try {
    await prisma.fieldAssistant.delete({
      where: { id }
    })
    revalidatePath('/admin/assistants')
    revalidatePath('/operator/assistants')
    return { success: true }
  } catch (error: any) {
    handleError(error, { action: 'delete', title: 'Gagal menghapus asisten' })
    return { success: false, error: error.message }
  }
}
