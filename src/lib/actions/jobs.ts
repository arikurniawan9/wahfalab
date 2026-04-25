'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function getJobOrders(
  page = 1, 
  limit = 10, 
  search = "",
  filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    fieldOfficerId?: string;
    customerId?: string;
    serviceType?: string;
  }
) {
  const skip = (page - 1) * limit
  
  // Build where clause
  const where: any = {}
  
  // Search filter
  if (search) {
    where.OR = [
      { tracking_code: { contains: search, mode: 'insensitive' as const } },
      { quotation: { quotation_number: { contains: search, mode: 'insensitive' as const } } },
      { quotation: { profile: { full_name: { contains: search, mode: 'insensitive' as const } } } },
      { quotation: { profile: { company_name: { contains: search, mode: 'insensitive' as const } } } }
    ]
  }
  
  // Status filter
  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status
  }
  
  // Date range filter
  if (filters?.dateFrom || filters?.dateTo) {
    where.created_at = {}
    if (filters.dateFrom) {
      where.created_at.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      where.created_at.lte = new Date(filters.dateTo)
    }
  }
  
  // Field officer filter
  if (filters?.fieldOfficerId) {
    where.sampling_assignment = {
      field_officer_id: filters.fieldOfficerId
    }
  }
  
  // Customer filter
  if (filters?.customerId) {
    where.quotation = {
      ...(where.quotation || {}),
      profile_id: filters.customerId
    }
  }
  
  // Service type filter
  if (filters?.serviceType) {
    where.quotation = {
      ...(where.quotation || {}),
      items: {
        some: {
          service: {
            category: filters.serviceType
          }
        }
      }
    }
  }

  try {
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
          analysis_started_at: true,
          analysis_done_at: true,
          reporting_done_at: true,
          invoice: {
            select: {
              id: true,
              status: true,
              amount: true,
              invoice_number: true
            }
          },
          payment: {
            select: {
              id: true,
              payment_status: true,
              amount: true,
              transfer_reference: true,
              payment_proof_url: true,
              paid_at: true
            }
          },
          sampling_assignment: {
            select: {
              id: true,
              status: true,
              scheduled_date: true,
              actual_date: true,
              field_officer: {
                select: {
                  id: true,
                  full_name: true
                }
              },
              assistants: {
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
              total_amount: true,
              perdiem_price: true,
              perdiem_qty: true,
              perdiem_name: true,
              transport_price: true,
              transport_qty: true,
              transport_name: true,
              profile: {
                select: {
                  id: true,
                  full_name: true,
                  company_name: true,
                  email: true,
                  phone: true,
                  address: true
                }
              },
              items: {
                select: {
                  id: true,
                  qty: true,
                  price_snapshot: true,
                  parameter_snapshot: true,
                  service: {
                    select: {
                      id: true,
                      name: true,
                      category: true
                    }
                  },
                  equipment: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          lab_analysis: {
            select: {
              id: true,
              analyst: {
                select: {
                  id: true,
                  full_name: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.jobOrder.count({ where })
    ])

    return serializeData({ 
      items, 
      total, 
      pages: Math.ceil(total / limit) 
    });
  } catch (error) {
    console.error('Error fetching job orders:', error);
    return { items: [], total: 0, pages: 0, error: 'Gagal mengambil data' };
  }
}

/**
 * Get field officers for filter dropdown
 */
export async function getFieldOfficers() {
  try {
    const officers = await prisma.profile.findMany({
      where: { role: 'field_officer' },
      select: {
        id: true,
        full_name: true,
        email: true
      },
      orderBy: { full_name: 'asc' }
    })
    return serializeData(officers)
  } catch (error) {
    console.error('Error getting field officers:', error)
    return []
  }
}

/**
 * Get customers for filter dropdown
 */
export async function getCustomers() {
  try {
    const customers = await prisma.profile.findMany({
      where: { role: 'client' },
      select: {
        id: true,
        full_name: true,
        company_name: true,
        email: true
      },
      orderBy: { full_name: 'asc' }
    })
    return serializeData(customers)
  } catch (error) {
    console.error('Error getting customers:', error)
    return []
  }
}

/**
 * Get job statistics for dashboard
 */
export async function getJobStats() {
  try {
    const [total, scheduled, sampling, analysisReady, analysis, analysisDone, reporting, completed] = await Promise.all([
      prisma.jobOrder.count(),
      prisma.jobOrder.count({ where: { status: 'scheduled' } }),
      prisma.jobOrder.count({ where: { status: 'sampling' } }),
      prisma.jobOrder.count({ where: { status: 'analysis_ready' } }),
      prisma.jobOrder.count({ where: { status: 'analysis' } }),
      prisma.jobOrder.count({ where: { status: 'analysis_done' } }),
      prisma.jobOrder.count({ where: { status: 'reporting' } }),
      prisma.jobOrder.count({ where: { status: 'completed' } }),
    ])
    
    return serializeData({
      total,
      scheduled,
      sampling,
      analysisReady,
      analysis,
      analysisDone,
      reporting,
      completed
    })
  } catch (error) {
    console.error('Error getting job stats:', error)
    return { total: 0, scheduled: 0, sampling: 0, analysisReady: 0, analysis: 0, analysisDone: 0, reporting: 0, completed: 0 }
  }
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

    // TODO: Delete photos from Cloud Storage via API route

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

export async function getJobOrderById(id: string) {
  try {
    const item = await prisma.jobOrder.findUnique({
      where: { id },
      select: {
        id: true,
        tracking_code: true,
        status: true,
        notes: true,
        created_at: true,
        analysis_started_at: true,
        analysis_done_at: true,
        reporting_done_at: true,
        sampling_assignment: {
          select: {
            id: true,
            status: true,
            scheduled_date: true,
            actual_date: true,
            location: true,
            field_officer: {
              select: {
                id: true,
                full_name: true
              }
            },
            assistants: {
              select: {
                id: true,
                full_name: true
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
                company_name: true,
                address: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    })

    if (!item) return null
    return serializeData(item)
  } catch (error) {
    console.error('Error fetching job order by id:', error)
    return null
  }
}

export async function sendTravelOrderToField(jobOrderId: string) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return { error: 'Unauthorized' }
    }

    const sender = await prisma.profile.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, full_name: true, email: true }
    })

    if (!sender || !['admin', 'operator'].includes(sender.role)) {
      return { error: 'Forbidden' }
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      select: {
        id: true,
        tracking_code: true,
        sampling_assignment: {
          select: {
            id: true,
            scheduled_date: true,
            travel_order: {
              select: {
                id: true
              }
            },
            field_officer: {
              select: {
                id: true,
                full_name: true
              }
            }
          }
        }
      }
    })

    if (!jobOrder) {
      return { error: 'Job order tidak ditemukan' }
    }

    if (!jobOrder.sampling_assignment || !jobOrder.sampling_assignment.field_officer?.id) {
      return { error: 'Job order belum memiliki penugasan petugas lapangan' }
    }

    const assignment = jobOrder.sampling_assignment
    const travelOrderId = assignment.travel_order?.id
    const scheduleText = assignment.scheduled_date
      ? new Date(assignment.scheduled_date).toLocaleDateString('id-ID')
      : 'sesuai jadwal'

    await prisma.notification.create({
      data: {
        user_id: assignment.field_officer.id,
        type: 'job_assigned',
        title: 'Surat Tugas Dikirim',
        message: `Surat tugas untuk ${jobOrder.tracking_code} telah dikirim oleh ${sender.full_name || sender.email}. Jadwal: ${scheduleText}.`,
        link: travelOrderId
          ? `/field/travel-orders/${travelOrderId}/preview`
          : `/field/assignments/${assignment.id}`,
        metadata: {
          job_order_id: jobOrder.id,
          assignment_id: assignment.id,
          travel_order_id: travelOrderId,
          tracking_code: jobOrder.tracking_code,
          sent_by: sender.id
        }
      }
    })

    revalidatePath('/api/notifications')
    revalidatePath('/field')
    revalidatePath('/admin/jobs')

    return { success: true }
  } catch (error: any) {
    console.error('Send Travel Order To Field Error:', error)
    return { error: error.message || 'Gagal mengirim surat tugas' }
  }
}
