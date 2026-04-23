'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { generateInvoiceNumber } from '@/lib/utils/generateNumber'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { audit } from '@/lib/audit-log'
import { auth } from '@/lib/auth'
import { notifyInvoiceGenerated } from '@/lib/actions/notifications'
import type { Prisma } from '@/generated/prisma'

const INVOICE_REQUEST_MARKER = '[INVOICE_REQUESTED]'

export async function getNextInvoiceNumber() {
  return await generateInvoiceNumber()
}

export async function getQuotationById(id: string) {
  try {
    const item = await prisma.quotation.findUnique({
      where: { id },
      select: {
        id: true,
        quotation_number: true,
        title: true,
        sampling_location: true,
        date: true,
        status: true,
        subtotal: true,
        discount_amount: true,
        use_tax: true,
        tax_amount: true,
        perdiem_name: true,
        perdiem_price: true,
        perdiem_qty: true,
        transport_name: true,
        transport_price: true,
        transport_qty: true,
        total_amount: true,
        created_at: true,
        user_id: true,
        profile: {
          select: {
            id: true,
            full_name: true,
            company_name: true,
            address: true,
            email: true
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
                category: true, 
                regulation: true,
                regulation_ref: { select: { name: true } }
              } 
            },
            equipment: { select: { id: true, name: true } }
          }
        }
      }
    })
    return serializeData(item)
  } catch (error) {
    console.error('Get Quotation Error:', error)
    throw new Error('Gagal mengambil data penawaran')
  }
}

export async function getQuotations(
  pageOrOptions?: number | { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    userId?: string;
    date_from?: string;
    date_to?: string;
  },
  limit = 10,
  search = "",
  status?: string,
  userId?: string
) {
  // Support both old positional params and new object params
  const page = typeof pageOrOptions === 'number' ? pageOrOptions : (pageOrOptions?.page ?? 1)
  const options = typeof pageOrOptions === 'object' ? pageOrOptions : {}
  limit = typeof pageOrOptions === 'number' ? limit : (options?.limit ?? 10)
  search = typeof pageOrOptions === 'number' ? search : (options?.search ?? "")
  status = typeof pageOrOptions === 'number' ? status : (options?.status)
  const finalUserId = typeof pageOrOptions === 'object' ? options?.userId : userId
  const date_from = typeof pageOrOptions === 'object' ? options?.date_from : undefined
  const date_to = typeof pageOrOptions === 'object' ? options?.date_to : undefined

  const skip = (page - 1) * limit
  
  const where: any = {}
  
  if (search) {
    where.OR = [
      { quotation_number: { contains: search, mode: 'insensitive' as const } },
      { profile: { full_name: { contains: search, mode: 'insensitive' as const } } },
      { profile: { company_name: { contains: search, mode: 'insensitive' as const } } },
    ]
  }
  
  if (status && status !== 'all') {
    where.status = status
  }

  if (finalUserId) {
    where.user_id = finalUserId
  }

  if (date_from || date_to) {
    where.created_at = {}
    if (date_from) where.created_at.gte = new Date(date_from)
    if (date_to) {
      const toDate = new Date(date_to)
      toDate.setHours(23, 59, 59, 999)
      where.created_at.lte = toDate
    }
  }

  const [items, total, counts] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      select: {
        id: true,
        quotation_number: true,
        title: true,
        sampling_location: true,
        date: true,
        status: true,
        subtotal: true,
        discount_amount: true,
        use_tax: true,
        tax_amount: true,
        perdiem_name: true,
        perdiem_price: true,
        perdiem_qty: true,
        transport_name: true,
        transport_price: true,
        transport_qty: true,
        total_amount: true,
        created_at: true,
        user_id: true,
        profile: {
          select: {
            id: true,
            full_name: true,
            company_name: true
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
                category: true, 
                regulation: true,
                regulation_ref: { select: { name: true } }
              } 
            },
            equipment: { select: { id: true, name: true } }
          }
        },
        job_orders: {
          select: {
            id: true,
            tracking_code: true,
            status: true,
            notes: true,
            invoice: {
              select: {
                id: true,
                invoice_number: true,
                status: true,
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.quotation.count({ where }),
    prisma.quotation.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: finalUserId ? { user_id: finalUserId } : {}
    })
  ])

  // Process counts into a flat object
  const statusCounts = {
    total: counts.reduce((acc: number, curr: Prisma.QuotationGroupByOutputType) => acc + (curr._count?._all ?? 0), 0),
    draft: counts.find((c: Prisma.QuotationGroupByOutputType) => c.status === 'draft')?._count?._all || 0,
    accepted: counts.find((c: Prisma.QuotationGroupByOutputType) => c.status === 'accepted')?._count?._all || 0,
    rejected: counts.find((c: Prisma.QuotationGroupByOutputType) => c.status === 'rejected')?._count?._all || 0,
    paid: counts.find((c: Prisma.QuotationGroupByOutputType) => c.status === 'paid')?._count?._all || 0,
  }

  // Deeply serialize decimals and dates to avoid Client Component errors
  return JSON.parse(JSON.stringify(serializeData({ 
    items, 
    total, 
    pages: Math.ceil(total / limit),
    statusCounts
  })));
}

export async function publishInvoiceRequest(quotationId: string) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return { error: 'Unauthorized' }
    }

    const requester = await prisma.profile.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, full_name: true, email: true }
    })

    if (!requester || !['admin', 'operator'].includes(requester.role)) {
      return { error: 'Forbidden' }
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        profile: {
          select: { id: true, full_name: true, company_name: true }
        },
        job_orders: {
          include: {
            invoice: {
              select: { id: true, invoice_number: true, status: true }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!quotation) {
      return { error: 'Penawaran tidak ditemukan' }
    }

    if (quotation.status !== 'accepted') {
      return { error: 'Invoice hanya dapat diterbitkan dari penawaran yang sudah diterima' }
    }

    const jobOrder = quotation.job_orders[0]
    if (!jobOrder) {
      return { error: 'Job order belum tersedia untuk penawaran ini' }
    }

    if (jobOrder.invoice) {
      return { error: 'Invoice untuk penawaran ini sudah tersedia' }
    }

    if (jobOrder.notes?.includes(INVOICE_REQUEST_MARKER)) {
      return { success: true, alreadyRequested: true }
    }

    const requestStamp = `${INVOICE_REQUEST_MARKER} by=${requester.full_name || requester.email} at=${new Date().toISOString()}`
    const updatedNotes = [jobOrder.notes, requestStamp].filter(Boolean).join('\n')

    await prisma.jobOrder.update({
      where: { id: jobOrder.id },
      data: { notes: updatedNotes }
    })

    const financeAndAdmins = await prisma.profile.findMany({
      where: {
        OR: [
          { role: 'finance' },
          { role: 'admin' }
        ]
      },
      select: { id: true }
    })

    const targetUsers = financeAndAdmins.filter((user: { id: string }) => user.id !== requester.id)

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map((recipient: { id: string }) => ({
          user_id: recipient.id,
          type: 'invoice_generated',
          title: 'Permintaan Invoice Baru',
          message: `${requester.role === 'admin' ? 'Admin' : 'Operator'} ${requester.full_name || requester.email} meminta penerbitan invoice untuk ${quotation.quotation_number}. Invoice draft akan tersedia setelah sampling selesai.`,
          link: '/finance/invoices',
          metadata: {
            quotation_id: quotation.id,
            quotation_number: quotation.quotation_number,
            job_order_id: jobOrder.id,
            tracking_code: jobOrder.tracking_code,
            requested_by: requester.full_name || requester.email,
          }
        }))
      })
    }

    const samplingFinishedStatuses = ['analysis_ready', 'analysis', 'analysis_done', 'reporting', 'completed', 'pending_payment', 'paid']
    let createdInvoice: any = null

    if (samplingFinishedStatuses.includes(jobOrder.status)) {
      const invoiceNumber = await generateInvoiceNumber('INV')
      createdInvoice = await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          job_order_id: jobOrder.id,
          quotation_id: quotation.id,
          amount: quotation.total_amount,
          status: 'draft',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          created_by: requester.id
        }
      })

      await notifyInvoiceGenerated(
        createdInvoice.id,
        createdInvoice.invoice_number,
        Number(createdInvoice.amount),
        quotation.profile?.company_name || quotation.profile?.full_name || 'Client'
      )
    }

    revalidatePath('/admin/quotations')
    revalidatePath('/operator/quotations')
    revalidatePath('/finance/invoices')
    revalidatePath('/api/notifications')

    return {
      success: true,
      requested: true,
      invoiceCreated: !!createdInvoice
    }
  } catch (error: any) {
    console.error('Publish invoice request error:', error)
    return { error: error.message || 'Gagal menerbitkan permintaan invoice' }
  }
}

export async function updateQuotationStatus(id: string, status: any) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id') || 'anonymous'
    
    // Enforce rate limiting
    enforceRateLimit(userId, 'update_job_status', RATE_LIMITS.UPDATE_JOB_STATUS.limit, RATE_LIMITS.UPDATE_JOB_STATUS.windowMs)
    
    // Get old data for audit
    const oldQuotation = await prisma.quotation.findUnique({
      where: { id },
      select: { status: true }
    })
    
    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status }
    })

    // Audit log
    await audit.updateQuotation(
      { id, status: oldQuotation?.status },
      { id, status }
    )

    // NOTIFIKASI SAAT PENAWARAN DIKIRIM (sent)
    if (status === 'sent') {
      const currentQuotation = await prisma.quotation.findUnique({
        where: { id },
        select: { user_id: true, quotation_number: true }
      })

      if (currentQuotation?.user_id) {
        await prisma.notification.create({
          data: {
            user_id: currentQuotation.user_id,
            type: 'system',
            title: 'Penawaran Harga Baru',
            message: `Penawaran ${currentQuotation.quotation_number} telah diterbitkan. Silakan periksa dan berikan persetujuan.`,
            link: `/dashboard/quotations/${id}`
          }
        })
      }
    }

    // WORKFLOW: Jika diterima (accepted), otomatis buat Job Order
    if (status === 'accepted') {
      const existingJob = await prisma.jobOrder.findFirst({
        where: { quotation_id: id }
      })

      if (!existingJob) {
        const jobOrder = await prisma.jobOrder.create({
          data: {
            quotation_id: id,
            tracking_code: `JOB-${Date.now()}`,
            status: 'scheduled'
          }
        })
        
        // Audit log job order creation
        await audit.createJobOrder(jobOrder)

        // NOTIFIKASI KLIEN: Kirim notifikasi ke klien
        const currentQuotation = await prisma.quotation.findUnique({
          where: { id },
          select: { user_id: true, quotation_number: true }
        })

        if (currentQuotation?.user_id) {
          const notification = await prisma.notification.create({
            data: {
              user_id: currentQuotation.user_id,
              type: 'system',
              title: 'Penawaran Diterima',
              message: `Penawaran ${currentQuotation.quotation_number} telah disetujui. Pekerjaan Anda kini masuk dalam antrean progres order.`,
              link: `/dashboard/orders`
            }
          })

          // Audit log notification creation
          await audit.logAudit({
            action: 'send_notification',
            entity_type: 'notification',
            entity_id: notification.id,
            user_id: userId, // ID Admin yang melakukan approval
            new_data: notification
          })
        }
      }
    }

    revalidatePath('/admin/quotations')
    revalidatePath('/operator/jobs')
    revalidatePath('/admin/sampling')
    return { success: true }
  } catch (error) {
    console.error('Update Status Error:', error)
    throw new Error('Gagal memperbarui status')
  }
}

export async function deleteQuotation(id: string, requesterId?: string, requesterRole?: string) {
  try {
    // Get quotation data for audit
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: {
        id: true,
        quotation_number: true,
        total_amount: true,
        status: true
      }
    })

    if (!quotation) {
      throw new Error('Penawaran tidak ditemukan')
    }

    // Admin/Operator can delete directly
    // 1. Hapus penugasan sampling terkait jika ada (melalui JobOrder)
    const jobOrders = await prisma.jobOrder.findMany({ where: { quotation_id: id } });
    const jobIds = jobOrders.map((j: any) => j.id);

    if (jobIds.length > 0) {
      await prisma.samplingAssignment.deleteMany({ where: { job_order_id: { in: jobIds } } });
      // 2. Hapus JobOrder terkait
      await prisma.jobOrder.deleteMany({ where: { id: { in: jobIds } } });
    }

    // 3. Hapus item penawaran & penawarannya
    await prisma.quotationItem.deleteMany({ where: { quotation_id: id } });
    await prisma.quotation.delete({ where: { id } });

    // Audit log
    await audit.deleteQuotation(quotation)

    revalidatePath('/admin/quotations');
    return { success: true, message: 'Penawaran berhasil dihapus' };
  } catch (error) {
    console.error('Delete Error:', error);
    throw new Error('Gagal menghapus penawaran dan data terkait');
  }
}

export async function deleteManyQuotations(ids: string[]) {
  try {
    // Gunakan transaksi untuk memastikan semua terhapus atau tidak sama sekali
    await prisma.$transaction(async (tx: any) => {
      const jobOrders = await tx.jobOrder.findMany({ where: { quotation_id: { in: ids } } });
      const jobIds = jobOrders.map((j: any) => j.id);

      if (jobIds.length > 0) {
        await tx.samplingAssignment.deleteMany({ where: { job_order_id: { in: jobIds } } });
        await tx.jobOrder.deleteMany({ where: { id: { in: jobIds } } });
      }

      await tx.quotationItem.deleteMany({ where: { quotation_id: { in: ids } } });
      await tx.quotation.deleteMany({ where: { id: { in: ids } } });
    });

    revalidatePath('/admin/quotations');
    return { success: true, message: 'Data-data penawaran berhasil dihapus' };
  } catch (error) {
    console.error('Bulk Delete Error:', error);
    throw new Error('Gagal menghapus beberapa data');
  }
}

export async function cloneQuotation(id: string) {
  try {
    const source = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!source) throw new Error("Quotation not found")

    const nextNumber = await generateInvoiceNumber("INV")

    const cloned = await prisma.quotation.create({
      data: {
        quotation_number: nextNumber,
        title: source.title,
        sampling_location: source.sampling_location,
        user_id: source.user_id,
        subtotal: source.subtotal,
        discount_amount: source.discount_amount,
        use_tax: source.use_tax,
        tax_amount: source.tax_amount,
        perdiem_name: source.perdiem_name,
        perdiem_price: source.perdiem_price,
        perdiem_qty: source.perdiem_qty,
        transport_name: source.transport_name,
        transport_price: source.transport_price,
        transport_qty: source.transport_qty,
        total_amount: source.total_amount,
        status: 'draft',
        items: {
          create: source.items.map((item: any) => ({
            service_id: item.service_id || null,
            equipment_id: item.equipment_id || null,
            qty: item.qty,
            price_snapshot: item.price_snapshot,
          })),
        },
      },
    })

    revalidatePath('/admin/quotations')
    return { success: true, id: cloned.id }
  } catch (error) {
    console.error('Clone Error:', error)
    throw new Error('Gagal duplikasi penawaran')
  }
}

export async function createQuotation(formData: any) {
  console.log("CREATE QUOTATION - RECEIVED FORM DATA:", JSON.stringify(formData, null, 2));
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id') || 'anonymous'
    
    // Auto-link to user_id if not provided but email exists
    let finalUserId = formData.user_id;
    if (!finalUserId && formData.email) {
      const profile = await prisma.profile.findFirst({
        where: { email: { equals: formData.email, mode: 'insensitive' } }
      });
      if (profile) finalUserId = profile.id;
    }

    // Calculate Totals Server-Side for Integrity
    const itemsTotal = formData.items.reduce((acc: number, item: any) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
    const perdiemTotal = Number(formData.perdiem_price || 0) * Number(formData.perdiem_qty || 0);
    const transportTotal = Number(formData.transport_price || 0) * Number(formData.transport_qty || 0);
    const subtotalValue = itemsTotal + perdiemTotal + transportTotal - Number(formData.discount_amount || 0);
    const taxValue = formData.use_tax ? subtotalValue * 0.11 : 0;
    const finalTotal = subtotalValue + taxValue;

    const quotation = await prisma.quotation.create({
      data: {
        quotation_number: formData.quotation_number,
        title: formData.title || null,
        sampling_location: formData.sampling_location || null,
        user_id: finalUserId,
        subtotal: subtotalValue,
        discount_amount: formData.discount_amount || 0,
        use_tax: formData.use_tax,
        tax_amount: taxValue,

        perdiem_name: formData.perdiem_name || null,
        perdiem_price: formData.perdiem_price || 0,
        perdiem_qty: formData.perdiem_qty || 0,
        transport_name: formData.transport_name || null,
        transport_price: formData.transport_price || 0,
        transport_qty: formData.transport_qty || 0,

        total_amount: finalTotal,
        status: 'draft', // Status default baru: draft
        items: {
          create: formData.items.map((item: any) => ({
            service_id: item.service_id || null,
            equipment_id: item.equipment_id || null,
            qty: Number(item.qty || 1),
            price_snapshot: Number(item.price || 0),
            parameter_snapshot: (item.parameters && Array.isArray(item.parameters)) 
              ? item.parameters.filter(Boolean).join(", ") 
              : null,
          })),
        },
      },
    })

    // Audit log (Wrap in try-catch to prevent main action failure)
    try {
      await audit.createQuotation(quotation)
    } catch (auditError) {
      console.warn('Audit Log failed but quotation created:', auditError)
    }

    revalidatePath('/admin/quotations')
    revalidatePath('/operator/quotations')
    return { success: true, id: quotation.id, data: serializeData(quotation) }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal membuat penawaran')
  }
}

export async function updateQuotation(id: string, formData: any) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id') || 'anonymous'
    
    // Enforce rate limiting
    enforceRateLimit(userId, 'update_quotation', RATE_LIMITS.UPDATE_QUOTATION.limit, RATE_LIMITS.UPDATE_QUOTATION.windowMs)
    
    // Get existing quotation to compare items
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    })
    
    if (!existingQuotation) {
      throw new Error('Penawaran tidak ditemukan')
    }
    
    // Calculate Totals Server-Side for Integrity
    const itemsTotal = formData.items.reduce((acc: number, item: any) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
    const perdiemTotal = Number(formData.perdiem_price || 0) * Number(formData.perdiem_qty || 0);
    const transportTotal = Number(formData.transport_price || 0) * Number(formData.transport_qty || 0);
    const subtotalValue = itemsTotal + perdiemTotal + transportTotal - Number(formData.discount_amount || 0);
    const taxValue = formData.use_tax ? subtotalValue * 0.11 : 0;
    const finalTotal = subtotalValue + taxValue;

    // Update quotation with transaction to handle items
    const quotation = await prisma.$transaction(async (tx: any) => {
      // Delete existing items
      await tx.quotationItem.deleteMany({
        where: { quotation_id: id }
      })
      
      // Update main quotation data
      return tx.quotation.update({
        where: { id },
        data: {
          quotation_number: formData.quotation_number,
          title: formData.title || null,
          sampling_location: formData.sampling_location || null,
          subtotal: subtotalValue,
          discount_amount: formData.discount_amount || 0,
          use_tax: formData.use_tax,
          tax_amount: taxValue,
  
          perdiem_name: formData.perdiem_name || null,
          perdiem_price: formData.perdiem_price || 0,
          perdiem_qty: formData.perdiem_qty || 0,
          transport_name: formData.transport_name || null,
          transport_price: formData.transport_price || 0,
          transport_qty: formData.transport_qty || 0,
  
          total_amount: finalTotal,
          items: {
            create: formData.items.map((item: any) => ({
              service_id: item.service_id || null,
              equipment_id: item.equipment_id || null,
              qty: item.qty,
              price_snapshot: Number(item.price || 0),
              parameter_snapshot: Array.isArray(item.parameters) ? item.parameters.join(", ") : null,
            })),
          },
        },
      })
    })
    
    revalidatePath('/admin/quotations')
    revalidatePath(`/admin/quotations/${id}`)
    return { success: true, id: quotation.id }
  } catch (error) {
    console.error('Update Quotation Error:', error)
    throw new Error('Gagal memperbarui penawaran')
  }
}

