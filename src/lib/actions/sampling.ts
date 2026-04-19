'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { auth } from '@/lib/auth'
import { generateInvoice } from '@/lib/actions/payment'
import { notifySamplingCompleted, notifyInvoiceGenerated, notifyJobAssigned } from '@/lib/actions/notifications'
import { STORAGE_BUCKETS, deleteFromSupabaseStorage, uploadToSupabaseStorage } from '@/lib/supabase/storage'

export async function uploadSamplingPdf(assignmentId: string, file: File) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: 'Unauthorized' }
    }

    const fileExt = file.name.split('.').pop()
    if (fileExt?.toLowerCase() !== 'pdf') {
      return { error: 'Hanya file PDF yang diizinkan' }
    }

    const { publicUrl } = await uploadToSupabaseStorage({
      bucket: STORAGE_BUCKETS.travelOrders,
      folder: `sampling-documents/${assignmentId}`,
      file,
      allowedMimeTypes: ['application/pdf'],
      maxSizeBytes: 10 * 1024 * 1024,
    })

    await prisma.samplingAssignment.update({
      where: { id: assignmentId },
      data: { signed_travel_order_url: publicUrl }
    })

    revalidatePath('/field')
    revalidatePath(`/field/assignments/${assignmentId}`)

    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error('Error uploading PDF:', error)
    return { error: error.message }
  }
}

export async function deleteSamplingPdf(assignmentId: string) {
  try {
    const assignment = await prisma.samplingAssignment.findUnique({
      where: { id: assignmentId },
      select: { signed_travel_order_url: true }
    })

    if (assignment?.signed_travel_order_url) {
      await deleteFromSupabaseStorage(STORAGE_BUCKETS.travelOrders, assignment.signed_travel_order_url)

      await prisma.samplingAssignment.update({
        where: { id: assignmentId },
        data: { signed_travel_order_url: null }
      })
    }

    revalidatePath(`/field/assignments/${assignmentId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function uploadSamplingPhotos(assignmentId: string, formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return { error: 'Unauthorized' }
    }

    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    const assignment = await prisma.samplingAssignment.findUnique({
      where: { id: assignmentId },
      select: { field_officer_id: true, assistants: { select: { id: true } } }
    })

    const isOwner =
      assignment?.field_officer_id === profile?.id ||
      assignment?.assistants.some((assistant: any) => assistant.id === profile?.id) ||
      ['admin', 'operator'].includes(profile?.role || '')

    if (!assignment || !isOwner) {
      return { error: 'Forbidden' }
    }

    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File)
    if (files.length === 0) {
      return { error: 'Tidak ada file yang diunggah' }
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const { publicUrl } = await uploadToSupabaseStorage({
          bucket: STORAGE_BUCKETS.samplingPhotos,
          folder: `assignments/${assignmentId}`,
          file,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
          maxSizeBytes: 10 * 1024 * 1024,
        })

        return {
          url: publicUrl,
          name: file.name.replace(/\.[^/.]+$/, ''),
        }
      })
    )

    return { success: true, photos: uploaded }
  } catch (error: any) {
    console.error('Error uploading sampling photos:', error)
    return { error: error.message }
  }
}

export async function deleteSamplingPhoto(photoUrl: string) {
  try {
    await deleteFromSupabaseStorage(STORAGE_BUCKETS.samplingPhotos, photoUrl)
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting sampling photo:', error)
    return { error: error.message }
  }
}

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
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true }
  })

  const skip = (page - 1) * limit
  const where: any = {
    OR: [
      { field_officer_id: profile?.id },
      { assistants: { some: { id: profile?.id } } }
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
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const result = await prisma.$transaction(async (tx: any) => {
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
          created_by: profile?.id
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

export async function rejectSamplingAssignment(assignmentId: string, reason: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true }
  })

  try {
    const assignment = await prisma.samplingAssignment.findUnique({
      where: { id: assignmentId },
      include: { job_order: true }
    })

    if (!assignment || assignment.field_officer_id !== profile?.id) {
      return { error: 'Forbidden' }
    }

    await prisma.$transaction([
      // 1. Update assignment status to cancelled
      prisma.samplingAssignment.update({
        where: { id: assignmentId },
        data: { 
          status: 'cancelled',
          notes: `Ditolak oleh petugas: ${reason}`
        }
      }),
      // 2. Reset job_order status to scheduled (back to queue)
      prisma.jobOrder.update({
        where: { id: assignment.job_order_id },
        data: { status: 'scheduled' }
      })
    ])

    // 3. TODO: Add notification to Operator/Admin here
    
    revalidatePath('/field')
    revalidatePath('/operator/jobs')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateSamplingStatus(assignmentId: string, status: any, notes?: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true }
  })

  // Verifikasi bahwa assignment ini milik field officer yang login
  const assignment = await prisma.samplingAssignment.findUnique({
    where: { id: assignmentId },
    select: { field_officer_id: true, job_order_id: true }
  })

  if (!assignment || assignment.field_officer_id !== profile?.id) {
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
    // 1. Update ke analysis_ready agar muncul di daftar tugas Analis
    const jobOrder = await prisma.jobOrder.update({
      where: { id: assignment.job_order_id },
      data: {
        status: 'analysis_ready',
        notes: `Sampling completed by ${session.user.email || 'field officer'} - ${notes || ''}`
      },
      include: {
        quotation: {
          include: { profile: true }
        }
      }
    })

    // 2. Auto-generate invoice dengan status 'sent' agar bisa diproses Finance/Customer
    // CEK TERLEBIH DAHULU apakah invoice sudah ada untuk job ini
    const existingInvoice = await prisma.invoice.findUnique({
      where: { job_order_id: jobOrder.id }
    })

    const quotation = jobOrder.quotation
    if (quotation && !existingInvoice) {
      const invoiceNumber = `INV-${jobOrder.tracking_code}-${Date.now().toString().slice(-4)}`
      invoice = await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          job_order_id: jobOrder.id,
          quotation_id: quotation.id,
          amount: quotation.total_amount,
          status: 'sent',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          created_by: profile?.id
        }
      })

      // 3. Kirim notifikasi otomatis (hanya jika invoice baru dibuat)
      await notifySamplingCompleted(jobOrder.id, jobOrder.tracking_code)
      await notifyInvoiceGenerated(
        invoice.id,
        invoice.invoice_number,
        Number(invoice.amount),
        quotation.profile?.company_name || quotation.profile?.full_name || 'Client'
      )
    } else if (existingInvoice) {
      invoice = existingInvoice;
      // Jika sudah ada, pastikan notifikasi sampling tetap terkirim jika perlu
      await notifySamplingCompleted(jobOrder.id, jobOrder.tracking_code)
    }
  } else if (status === 'in_progress') {
    // Saat petugas klik "Terima Tugas", update JobOrder ke status 'sampling'
    await prisma.jobOrder.update({
      where: { id: assignment.job_order_id },
      data: {
        status: 'sampling',
        notes: `Tugas diterima oleh ${session.user.email || 'field officer'}`
      }
    })
  } else if (status === 'pending') {
    // Jika status dikembalikan ke pending, beri catatan khusus untuk operator
    await prisma.jobOrder.update({
      where: { id: assignment.job_order_id },
      data: {
        notes: `Petugas menangguhkan tugas (Pending). Alasan: ${notes || 'Tidak ada catatan'}`
      }
    })
  }

  revalidatePath('/field')
  revalidatePath('/field/assignments')
  revalidatePath('/analyst/jobs')
  revalidatePath('/finance')
  revalidatePath('/operator/jobs')
  revalidatePath('/dashboard')

  return serializeData({ success: true, invoice })
}

export async function updateSamplingPhotos(assignmentId: string, photoUrls: string[]) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true }
  })

  // Verifikasi ownership
  const assignment = await prisma.samplingAssignment.findUnique({
    where: { id: assignmentId },
    select: { field_officer_id: true, photos: true }
  })

  if (!assignment || assignment.field_officer_id !== profile?.id) {
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
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true }
  })

  // Verifikasi ownership
  const assignment = await prisma.samplingAssignment.findUnique({
    where: { id: assignmentId },
    select: { field_officer_id: true }
  })

  if (!assignment || assignment.field_officer_id !== profile?.id) {
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
  const session = await auth()
  if (!session?.user) return null
  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true }
  })

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
  if (profile?.role === 'admin' || profile?.role === 'operator') {
    return serializeData(assignment)
  }

  // Field officer atau assistant hanya bisa akses assignment mereka sendiri
  if (assignment.field_officer_id !== profile?.id && !assignment.assistants.some((a: any) => a.id === profile?.id)) {
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
    // Gunakan upsert untuk menangani penjadwalan ulang (reschedule)
    const assignment = await prisma.samplingAssignment.upsert({
      where: { job_order_id: data.job_order_id },
      update: {
        field_officer_id: data.field_officer_id,
        assistants: {
          set: [], // Hapus asisten lama dulu
          connect: data.assistant_ids?.map(id => ({ id })) || []
        },
        scheduled_date: new Date(data.scheduled_date),
        location: data.location,
        notes: data.notes,
        status: 'pending' // Reset status ke pending agar petugas harus menerima lagi
      },
      create: {
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

    // Update JobOrder status tetap scheduled (atau jangan diupdate di sini)
    // Penugasan sudah dibuat, tapi status Sampling baru aktif setelah petugas klik "Terima Tugas"
    
    // Kirim notifikasi ke petugas lapangan secara aman
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
