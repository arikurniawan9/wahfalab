'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { createClient } from '@/lib/supabase/server'

export async function getSamplingAssignments(fieldOfficerId: string) {
  const assignments = await prisma.samplingAssignment.findMany({
    where: { field_officer_id: fieldOfficerId },
    include: {
      job_order: {
        include: {
          quotation: {
            include: {
              profile: true,
              items: {
                include: {
                  service: {
                    include: { category_ref: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { scheduled_date: 'desc' }
  })

  return serializeData(assignments)
}

export async function getMySamplingAssignments(page = 1, limit = 10, status?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const skip = (page - 1) * limit
  const where: any = { field_officer_id: user.id }

  if (status && status !== 'all') {
    where.status = status
  }

  const [assignments, total] = await Promise.all([
    prisma.samplingAssignment.findMany({
      where,
      skip,
      take: limit,
      include: {
        job_order: {
          include: {
            quotation: {
              include: {
                profile: true,
                items: {
                  include: {
                    service: {
                      include: { category_ref: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { scheduled_date: 'desc' }
    }),
    prisma.samplingAssignment.count({ where })
  ])

  return serializeData({ items: assignments, total, pages: Math.ceil(total / limit) })
}

export async function updateSamplingStatus(assignmentId: string, status: any, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verifikasi bahwa assignment ini milik field officer yang login
  const assignment = await prisma.samplingAssignment.findUnique({
    where: { id: assignmentId },
    select: { field_officer_id: true, job_order_id: true }
  })

  if (!assignment || assignment.field_officer_id !== user.id) {
    return { error: 'Forbidden' }
  }

  const updateData: any = {
    status,
    updated_at: new Date()
  }

  if (notes) {
    updateData.notes = notes
  }

  // Jika status completed, set actual_date
  if (status === 'completed') {
    updateData.actual_date = new Date()
  }

  await prisma.samplingAssignment.update({
    where: { id: assignmentId },
    data: updateData
  })

  // Update JobOrder status jika sampling selesai
  if (status === 'completed') {
    await prisma.jobOrder.update({
      where: { id: assignment.job_order_id },
      data: {
        status: 'analysis',
        notes: `Sampling completed by ${user.email || 'field officer'} - ${notes || ''}`
      }
    })
  } else if (status === 'in_progress') {
    await prisma.jobOrder.update({
      where: { id: assignment.job_order_id },
      data: {
        status: 'sampling'
      }
    })
  }

  revalidatePath('/field')
  revalidatePath('/field/assignments')
  revalidatePath('/operator/jobs')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function updateSamplingPhotos(assignmentId: string, photoUrls: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verifikasi ownership
  const assignment = await prisma.samplingAssignment.findUnique({
    where: { id: assignmentId },
    select: { field_officer_id: true, photos: true }
  })

  if (!assignment || assignment.field_officer_id !== user.id) {
    return { error: 'Forbidden' }
  }

  const currentPhotos = (assignment.photos as any[]) || []
  const updatedPhotos = [...currentPhotos, ...photoUrls]

  await prisma.samplingAssignment.update({
    where: { id: assignmentId },
    data: {
      photos: updatedPhotos,
      updated_at: new Date()
    }
  })

  revalidatePath('/field')
  revalidatePath('/field/assignments')

  return { success: true }
}

export async function getAssignmentById(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const assignment = await prisma.samplingAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      job_order: {
        include: {
          quotation: {
            include: {
              profile: true,
              items: {
                include: {
                  service: {
                    include: { category_ref: true }
                  }
                }
              }
            }
          }
        }
      },
      field_officer: true
    }
  })

  if (!assignment) {
    return null
  }

  // Admin bisa akses semua assignment
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (profile?.role === 'admin') {
    return serializeData(assignment)
  }

  // Field officer hanya bisa akses assignment mereka sendiri
  if (assignment.field_officer_id !== user.id) {
    return null
  }

  return serializeData(assignment)
}

export async function createSamplingAssignment(data: {
  job_order_id: string
  field_officer_id: string
  scheduled_date: string
  location: string
  notes?: string
}) {
  try {
    const assignment = await prisma.samplingAssignment.create({
      data: {
        job_order_id: data.job_order_id,
        field_officer_id: data.field_officer_id,
        scheduled_date: new Date(data.scheduled_date),
        location: data.location,
        notes: data.notes,
        status: 'pending'
      },
      include: {
        job_order: true,
        field_officer: true
      }
    })

    // Update JobOrder status ke sampling
    await prisma.jobOrder.update({
      where: { id: data.job_order_id },
      data: {
        status: 'sampling'
      }
    })

    revalidatePath('/operator/jobs')
    revalidatePath('/field')
    revalidatePath('/admin')

    return { success: true, assignment }
  } catch (error: any) {
    console.error('Error creating sampling assignment:', error)
    return { error: error.message }
  }
}
