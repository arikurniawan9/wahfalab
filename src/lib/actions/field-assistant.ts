'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function getFieldAssistants() {
  try {
    const assistants = await prisma.fieldAssistant.findMany({
      orderBy: { full_name: 'asc' }
    })
    return serializeData(assistants)
  } catch (error) {
    console.error('Error getting field assistants:', error)
    return []
  }
}

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
    return { success: true, assistant: serializeData(assistant) }
  } catch (error: any) {
    return { error: error.message }
  }
}

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
    return { success: true, assistant: serializeData(assistant) }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteFieldAssistant(id: string) {
  try {
    await prisma.fieldAssistant.delete({
      where: { id }
    })
    revalidatePath('/admin/assistants')
    revalidatePath('/operator/assistants')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
