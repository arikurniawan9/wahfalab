'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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

    revalidatePath('/(admin)/quotations')
    return { success: true, id: quotation.id }
  } catch (error) {
    console.error('Prisma Error:', error)
    throw new Error('Gagal membuat penawaran')
  }
}
