'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { createClient } from '@/lib/supabase/server'
import { generateInvoice } from '@/lib/actions/payment'
import { notifySamplingCompleted, notifyInvoiceGenerated, notifyJobAssigned } from '@/lib/actions/notifications'

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
  const where: any = {
    OR: [
      { field_officer_id: user.id },
      { assistants: { some: { id: user.id } } }
    ]
  }

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
        },
        field_officer: true,
        assistants: true
      },
      orderBy: { scheduled_date: 'desc' }
    }),
    prisma.samplingAssignment.count({ where })
  ])

  return serializeData({ items: assignments, total, pages: Math.ceil(total / limit) })
}

/**
 * Complete sampling assignment with auto-notifications and invoice generation
 */
export async function completeSamplingAssignment(
  assignmentId: string,
  photos?: string[],
  notes?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update sampling assignment status
      const assignment = await tx.samplingAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'completed',
          actual_date: new Date(),
          photos: photos || undefined,
          notes: notes
        },
        include: {
          job_order: {
            include: {
              quotation: {
                include: {
                  profile: true,
                  items: {
                    include: {
                      service: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      // 2. Update job_order status to analysis_ready
      const jobOrder = await tx.jobOrder.update({
        where: { id: assignment.job_order_id },
        data: {
          status: 'analysis_ready'
        }
      })

      // 3. Auto-generate Invoice (Draft)
      const quotation = assignment.job_order.quotation
      const invoiceNumber = `INV-${Date.now()}`
      
      const invoice = await tx.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          job_order_id: jobOrder.id,
          quotation_id: quotation.id,
          amount: quotation.total_amount,
          status: 'draft',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          created_by: user.id
        }
      })

      return { assignment, jobOrder, invoice }
    })

    // 4. Send notifications (outside transaction)
    const trackingCode = result.jobOrder.tracking_code
    await notifySamplingCompleted(result.jobOrder.id, trackingCode)
    await notifyInvoiceGenerated(
      result.invoice.id,
      result.invoice.invoice_number,
      Number(result.invoice.amount),
      result.assignment.job_order.quotation.profile?.company_name || 
      result.assignment.job_order.quotation.profile?.full_name || 
      'Client'
    )

    revalidatePath('/field')
    revalidatePath('/field/assignments')
    revalidatePath('/analyst/jobs')
    revalidatePath('/finance')
    revalidatePath('/operator/jobs')

    return { 
      success: true, 
      assignment: result.assignment,
      jobOrder: result.jobOrder,
      invoice: result.invoice
    }
  } catch (error: any) {
    console.error('Error completing sampling assignment:', error)
    return { error: error.message }
  }
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

  let invoice: any = null

  // Update JobOrder status jika sampling selesai
  if (status === 'completed') {
    // Update to analysis_ready instead of completed
    const jobOrder = await prisma.jobOrder.update({
      where: { id: assignment.job_order_id },
      data: {
        status: 'analysis_ready',
        notes: `Sampling completed by ${user.email || 'field officer'} - ${notes || ''}`
      }
    })

    // Auto-generate invoice (draft)
    const quotation = await prisma.quotation.findUnique({
      where: { id: jobOrder.quotation_id },
      include: { profile: true }
    })

    if (quotation) {
      const invoiceNumber = `INV-${Date.now()}`
      invoice = await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          job_order_id: jobOrder.id,
          quotation_id: quotation.id,
          amount: quotation.total_amount,
          status: 'draft',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          created_by: user.id
        }
      })

      // Send notifications
      await notifySamplingCompleted(jobOrder.id, jobOrder.tracking_code)
      await notifyInvoiceGenerated(
        invoice.id,
        invoice.invoice_number,
        Number(invoice.amount),
        quotation.profile?.company_name || quotation.profile?.full_name || 'Client'
      )
    }
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
  revalidatePath('/analyst/jobs')
  revalidatePath('/finance')
  revalidatePath('/operator/jobs')
  revalidatePath('/dashboard')

  return { success: true, invoice }
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

export async function saveSamplingPhotosWithNames(assignmentId: string, photos: { url: string; name: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verifikasi ownership
  const assignment = await prisma.samplingAssignment.findUnique({
    where: { id: assignmentId },
    select: { field_officer_id: true }
  })

  if (!assignment || assignment.field_officer_id !== user.id) {
    return { error: 'Forbidden' }
  }

  // Save photos dengan struktur { url, name }
  await prisma.samplingAssignment.update({
    where: { id: assignmentId },
    data: {
      photos: photos,
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

  // Cari berdasarkan ID Assignment atau Job Order ID
  const assignment = await prisma.samplingAssignment.findFirst({
    where: {
      OR: [
        { id: assignmentId },
        { job_order_id: assignmentId }
      ]
    },
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
          },
          invoice: {
            select: {
              id: true,
              invoice_number: true,
              status: true,
              amount: true
            }
          }
        }
      },
      field_officer: true,
      assistants: true
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

  if (profile?.role === 'admin' || profile?.role === 'operator') {
    return serializeData(assignment)
  }

  // Field officer atau assistant hanya bisa akses assignment mereka sendiri
  if (assignment.field_officer_id !== user.id && !assignment.assistants.some((a: any) => a.id === user.id)) {
    return null
  }

  return serializeData(assignment)
}

export async function createSamplingAssignment(data: {
  job_order_id: string
  field_officer_id: string
  assistant_ids?: string[]
  scheduled_date: string
  location: string
  notes?: string
}) {
  try {
    const assignment = await prisma.samplingAssignment.create({
      data: {
        job_order_id: data.job_order_id,
        field_officer_id: data.field_officer_id,
        assistants: {
          connect: data.assistant_ids?.map(id => ({ id })) || []
        },
        scheduled_date: new Date(data.scheduled_date),
        location: data.location,
        notes: data.notes,
        status: 'pending'
      },
      include: {
        job_order: true,
        field_officer: true,
        assistants: true
      }
    })

    // Update JobOrder status ke sampling
    await prisma.jobOrder.update({
      where: { id: data.job_order_id },
      data: {
        status: 'sampling'
      }
    })

    // Kirim notifikasi ke petugas lapangan secara aman (Hanya petugas utama karena asisten tidak punya akun user)
    try {
      if (assignment.job_order?.tracking_code) {
        // Hanya kirim ke petugas utama karena relasi notification ke profile/user
        await notifyJobAssigned(
          [data.field_officer_id],
          assignment.id,
          assignment.job_order.tracking_code,
          data.location
        )
      }
    } catch (notificationError) {
      console.error('Failed to send assignment notification:', notificationError)
    }

    revalidatePath('/operator/jobs')
    revalidatePath('/field')
    revalidatePath('/admin')

    // Gunakan JSON.parse(JSON.stringify()) sebagai fallback jika serializeData tidak menangani Decimal secara mendalam
    return { success: true, assignment: JSON.parse(JSON.stringify(serializeData(assignment))) }
  } catch (error: any) {
    console.error('Error creating sampling assignment:', error)
    return { error: error.message }
  }
}

export async function getAllSamplingAssignments(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where = search ? {
    OR: [
      { location: { contains: search, mode: 'insensitive' as const } },
      { job_order: { tracking_code: { contains: search, mode: 'insensitive' as const } } },
      { field_officer: { full_name: { contains: search, mode: 'insensitive' as const } } }
    ]
  } : {}

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
                profile: true
              }
            }
          }
        },
        field_officer: true,
        assistants: true
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.samplingAssignment.count({ where })
  ])

  return serializeData({ items: assignments, total, pages: Math.ceil(total / limit) })
}

/**
 * Complete sampling assignment with auto-notifications and invoice generation
 */
