'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { generateInvoiceNumber } from '@/lib/utils/generateNumber'

export async function getNextInvoiceNumber() {
  return await generateInvoiceNumber("INV")
}

export async function getQuotationById(id: string) {
  try {
    const item = await prisma.quotation.findUnique({
      where: { id },
      select: {
        id: true,
        quotation_number: true,
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
            service: { select: { id: true, name: true, category: true } },
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
  pageOrOptions?: number | { page?: number; limit?: number; search?: string; status?: string },
  limit = 10,
  search = "",
  status?: string
) {
  // Support both old positional params and new object params
  const page = typeof pageOrOptions === 'number' ? pageOrOptions : (pageOrOptions?.page ?? 1)
  const options = typeof pageOrOptions === 'object' ? pageOrOptions : {}
  limit = typeof pageOrOptions === 'number' ? limit : (options?.limit ?? 10)
  search = typeof pageOrOptions === 'number' ? search : (options?.search ?? "")
  status = typeof pageOrOptions === 'number' ? status : (options?.status)

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

  const [items, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      select: {
        id: true,
        quotation_number: true,
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
            service: { select: { id: true, name: true, category: true } },
            equipment: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.quotation.count({ where })
  ])

  return serializeData({ items, total, pages: Math.ceil(total / limit) })
}

export async function updateQuotationStatus(id: string, status: any) {
  try {
    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status }
    })

    // WORKFLOW: Jika diterima (accepted), otomatis buat Job Order
    if (status === 'accepted') {
      const existingJob = await prisma.jobOrder.findFirst({
        where: { quotation_id: id }
      })

      if (!existingJob) {
        await prisma.jobOrder.create({
          data: {
            quotation_id: id,
            tracking_code: `JOB-${Date.now()}`,
            status: 'scheduled'
          }
        })
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
    // Check if requester is operator - requires approval
    if (requesterId && requesterRole === 'operator') {
      // Create approval request instead of deleting
      const quotation = await prisma.quotation.findUnique({
        where: { id },
        select: {
          id: true,
          quotation_number: true,
          total_amount: true,
          status: true
        }
      })

      await prisma.approvalRequest.create({
        data: {
          request_type: 'delete',
          entity_type: 'quotation',
          entity_id: id,
          requester_id: requesterId,
          reason: `Operator meminta penghapusan penawaran ${quotation?.quotation_number}`,
          old_data: quotation as any,
          status: 'pending'
        }
      })

      revalidatePath('/operator/quotations')
      return { 
        success: true, 
        message: 'Permintaan penghapusan berhasil dibuat. Menunggu persetujuan admin.'
      }
    }

    // Admin can delete directly
    // 1. Hapus penugasan sampling terkait jika ada (melalui JobOrder)
    const jobOrders = await prisma.jobOrder.findMany({ where: { quotation_id: id } });
    const jobIds = jobOrders.map(j => j.id);

    if (jobIds.length > 0) {
      await prisma.samplingAssignment.deleteMany({ where: { job_order_id: { in: jobIds } } });
      // 2. Hapus JobOrder terkait
      await prisma.jobOrder.deleteMany({ where: { id: { in: jobIds } } });
    }

    // 3. Hapus item penawaran & penawarannya
    await prisma.quotationItem.deleteMany({ where: { quotation_id: id } });
    await prisma.quotation.delete({ where: { id } });

    revalidatePath('/admin/quotations');
    return { success: true };
  } catch (error) {
    console.error('Delete Error:', error);
    throw new Error('Gagal menghapus penawaran dan data terkait');
  }
}

export async function deleteManyQuotations(ids: string[]) {
  try {
    // Gunakan transaksi untuk memastikan semua terhapus atau tidak sama sekali
    await prisma.$transaction(async (tx) => {
      const jobOrders = await tx.jobOrder.findMany({ where: { quotation_id: { in: ids } } });
      const jobIds = jobOrders.map(j => j.id);

      if (jobIds.length > 0) {
        await tx.samplingAssignment.deleteMany({ where: { job_order_id: { in: jobIds } } });
        await tx.jobOrder.deleteMany({ where: { id: { in: jobIds } } });
      }

      await tx.quotationItem.deleteMany({ where: { quotation_id: { in: ids } } });
      await tx.quotation.deleteMany({ where: { id: { in: ids } } });
    });

    revalidatePath('/admin/quotations');
    return { success: true };
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
  try {
    const quotation = await prisma.quotation.create({
      data: {
        quotation_number: formData.quotation_number,
        user_id: formData.user_id,
        subtotal: formData.subtotal,
        discount_amount: formData.discount_amount || 0,
        use_tax: formData.use_tax,
        tax_amount: formData.tax_amount,
        
        perdiem_name: formData.perdiem_name || null,
        perdiem_price: formData.perdiem_price || 0,
        perdiem_qty: formData.perdiem_qty || 0,
        transport_name: formData.transport_name || null,
        transport_price: formData.transport_price || 0,
        transport_qty: formData.transport_qty || 0,
        
        total_amount: formData.total_amount,
        status: 'draft', // Status default baru: draft
        items: {
          create: formData.items.map((item: any) => ({
            service_id: item.service_id || null,
            equipment_id: item.equipment_id || null,
            qty: item.qty,
            price_snapshot: item.price,
          })),
        },
      },
    })

    revalidatePath('/admin/quotations')
    return { success: true, id: quotation.id }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal membuat penawaran')
  }
}

export async function processPayment(id: string, method: string) {
  try {
    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status: 'paid' }
    })

    await prisma.jobOrder.create({
      data: {
        quotation_id: id,
        tracking_code: `JOB-${Date.now()}`,
        status: 'scheduled'
      }
    })

    revalidatePath('/admin/quotations')
    revalidatePath('/operator/jobs')
    return { success: true }
  } catch (error) {
    console.error('Payment Error:', error)
    throw new Error('Gagal memproses pembayaran')
  }
}
