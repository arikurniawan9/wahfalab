'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

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
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id') || 'anonymous'
    
    // Enforce rate limiting
    enforceRateLimit(userId, 'update_job_status', RATE_LIMITS.UPDATE_JOB_STATUS.limit, RATE_LIMITS.UPDATE_JOB_STATUS.windowMs)
    
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
  } catch (error) {
    console.error('Update Job Status Error:', error)
    throw new Error('Gagal memperbarui status job')
  }
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

export async function deleteJobOrderWithPhotos(jobOrderId: string) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id') || 'anonymous'
    
    // Enforce rate limiting
    enforceRateLimit(userId, 'delete_job_order', 5, 60000) // 5 per minute
    
    // Get job order with sampling assignment and photos
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: {
        sampling_assignment: {
          select: {
            id: true,
            photos: true
          }
        }
      }
    })
    
    if (!jobOrder) {
      return { error: 'Job Order tidak ditemukan' }
    }
    
    // Delete photos from Supabase Storage
    const supabase = await createClient()
    const photosRaw: any = jobOrder.sampling_assignment?.photos
    const photos: any[] = Array.isArray(photosRaw) ? photosRaw : []
    
    if (photos.length > 0) {
      const fileNames = photos.map((p: { url: string; name: string } | string) => {
        const url = typeof p === 'string' ? p : p.url
        return url.split('/').pop()?.split('?')[0] || ''
      }).filter(Boolean)
      
      if (fileNames.length > 0) {
        await supabase.storage
          .from('sampling-photos')
          .remove(fileNames)
      }
    }
    
    // Delete sampling assignment (will cascade delete photos reference)
    if (jobOrder.sampling_assignment) {
      await prisma.samplingAssignment.delete({
        where: { id: jobOrder.sampling_assignment.id }
      })
    }
    
    // Delete job order
    await prisma.jobOrder.delete({
      where: { id: jobOrderId }
    })
    
    revalidatePath('/admin/sampling')
    revalidatePath('/operator/jobs')
    
    return { success: true }
  } catch (error) {
    console.error('Delete Job Order Error:', error)
    return { error: 'Gagal menghapus Job Order dan foto' }
  }
}
