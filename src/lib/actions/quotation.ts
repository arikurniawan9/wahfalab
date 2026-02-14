'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

import { generateInvoiceNumber } from '@/lib/utils/generateNumber'

export async function getNextInvoiceNumber() {
  return await generateInvoiceNumber("INV")
}

export async function getQuotations(page = 1, limit = 10, search = "") {
  const skip = (page - 1) * limit
  const where = search ? {
    OR: [
      { quotation_number: { contains: search, mode: 'insensitive' as const } },
      { profile: { full_name: { contains: search, mode: 'insensitive' as const } } },
      { profile: { company_name: { contains: search, mode: 'insensitive' as const } } },
    ]
  } : {}

  const [items, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip,
      take: limit,
      include: {
        profile: {
          select: { full_name: true, company_name: true, id: true }
        },
        items: {
          include: { 
            service: {
              include: { category_ref: true }
            } 
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.quotation.count({ where })
  ])

  return serializeData({ items, total, pages: Math.ceil(total / limit) })
}

export async function updateQuotationStatus(id: string, status: any) {
  await prisma.quotation.update({
    where: { id },
    data: { status }
  })
  revalidatePath('/admin/quotations')
  return { success: true }
}

export async function deleteQuotation(id: string) {
  await prisma.quotation.delete({
    where: { id }
  })
  revalidatePath('/admin/quotations')
  return { success: true }
}

export async function deleteManyQuotations(ids: string[]) {
  await prisma.quotation.deleteMany({
    where: { id: { in: ids } }
  })
  revalidatePath('/admin/quotations')
  return { success: true }
}

export async function createQuotation(formData: any) {
  try {
    const quotation = await prisma.quotation.create({
      data: {
        quotation_number: formData.quotation_number,
        user_id: formData.user_id,
        subtotal: formData.subtotal,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        status: 'draft',
        items: {
          create: formData.items.map((item: any) => ({
            service_id: item.service_id,
            qty: item.qty,
            price_snapshot: item.price,
            parameter_snapshot: item.parameters,
          })),
        },
      },
    })

    revalidatePath('/admin/quotations')
    revalidatePath('/operator/jobs')
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
