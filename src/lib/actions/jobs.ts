'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function getJobOrders(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where = search ? {
    OR: [
      { tracking_code: { contains: search, mode: 'insensitive' as const } },
      { quotation: { quotation_number: { contains: search, mode: 'insensitive' as const } } },
      { quotation: { profile: { full_name: { contains: search, mode: 'insensitive' as const } } } }
    ]
  } : {}

  const [items, total] = await Promise.all([
    prisma.jobOrder.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        tracking_code: true,
        status: true,
        notes: true,
        certificate_url: true,
        created_at: true,
        sampling_assignment: {
          select: {
            id: true,
            status: true,
            field_officer: {
              select: {
                id: true,
                full_name: true
              }
            },
            travel_order: {
              select: {
                id: true,
                document_number: true
              }
            }
          }
        },
        quotation: {
          select: {
            id: true,
            quotation_number: true,
            profile: {
              select: {
                id: true,
                full_name: true,
                company_name: true
              }
            },
            items: {
              take: 1,
              select: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.jobOrder.count({ where })
  ])

  return serializeData({ items, total, pages: Math.ceil(total / limit) })
}

export async function updateJobStatus(id: string, status: any, notes?: string) {
  await prisma.jobOrder.update({
    where: { id },
    data: { 
      status,
      notes: notes || null
    }
  })
  revalidatePath('/operator/jobs')
  revalidatePath('/dashboard') 
  return { success: true }
}

export async function uploadCertificate(id: string, url: string) {
  await prisma.jobOrder.update({
    where: { id },
    data: { 
      certificate_url: url,
      status: 'completed'
    }
  })
  revalidatePath('/operator/jobs')
  revalidatePath('/dashboard')
  return { success: true }
}
