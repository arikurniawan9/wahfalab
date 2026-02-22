'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { generateInvoiceNumber } from '@/lib/utils/generateNumber'

/**
 * Generate invoice when job order is completed
 */
export async function generateInvoice(jobOrderId: string) {
  try {
    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { job_order_id: jobOrderId }
    })

    if (existingPayment) {
      return { success: true, payment: existingPayment }
    }

    // Get job order with quotation
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: {
        quotation: true
      }
    })

    if (!jobOrder) {
      return { error: 'Job Order tidak ditemukan' }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber("INV")

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        job_order_id: jobOrderId,
        invoice_number: invoiceNumber,
        amount: jobOrder.quotation.total_amount,
        payment_status: 'pending'
      }
    })

    // Update job order status to pending_payment
    await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        status: 'pending_payment'
      }
    })

    revalidatePath('/operator')
    revalidatePath('/dashboard')

    return { success: true, payment }
  } catch (error) {
    console.error('Generate invoice error:', error)
    return { error: 'Gagal membuat tagihan' }
  }
}

/**
 * Process payment (cash or transfer)
 */
export async function processPayment(
  paymentId: string,
  paymentMethod: 'cash' | 'transfer',
  transferReference?: string
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        job_order: true
      }
    })

    if (!payment) {
      return { error: 'Tagihan tidak ditemukan' }
    }

    if (payment.payment_status === 'paid') {
      return { error: 'Tagihan sudah lunas' }
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        payment_method: paymentMethod,
        transfer_reference: transferReference,
        payment_status: 'paid',
        paid_at: new Date()
      }
    })

    // Update job order status to paid
    await prisma.jobOrder.update({
      where: { id: payment.job_order_id },
      data: {
        status: 'paid'
      }
    })

    revalidatePath('/operator')
    revalidatePath('/dashboard')

    return { success: true, payment: updatedPayment }
  } catch (error) {
    console.error('Process payment error:', error)
    return { error: 'Gagal memproses pembayaran' }
  }
}

/**
 * Cancel payment
 */
export async function cancelPayment(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return { error: 'Tagihan tidak ditemukan' }
    }

    if (payment.payment_status === 'paid') {
      return { error: 'Tidak dapat membatalkan tagihan yang sudah lunas' }
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        payment_status: 'cancelled'
      }
    })

    // Revert job order to completed
    await prisma.jobOrder.update({
      where: { id: payment.job_order_id },
      data: {
        status: 'completed'
      }
    })

    revalidatePath('/operator')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Cancel payment error:', error)
    return { error: 'Gagal membatalkan tagihan' }
  }
}

/**
 * Get payment by job order ID
 */
export async function getPaymentByJobOrderId(jobOrderId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { job_order_id: jobOrderId }
    })

    return serializeData(payment)
  } catch (error) {
    console.error('Get payment error:', error)
    return null
  }
}

/**
 * Get payment by invoice number
 */
export async function getPaymentByInvoiceNumber(invoiceNumber: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { invoice_number: invoiceNumber },
      include: {
        job_order: {
          include: {
            quotation: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })

    return serializeData(payment)
  } catch (error) {
    console.error('Get payment error:', error)
    return null
  }
}

/**
 * Get all payments for operator
 */
export async function getAllPayments(page = 1, limit = 10, status?: string) {
  try {
    const skip = (page - 1) * limit
    const where: any = {}

    if (status && status !== 'all') {
      where.payment_status = status
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.payment.count({ where })
    ])

    return serializeData({
      items: payments,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Get all payments error:', error)
    return { items: [], total: 0, pages: 0 }
  }
}

/**
 * Get pending payments count for dashboard
 */
export async function getPendingPaymentsCount() {
  try {
    const count = await prisma.payment.count({
      where: { payment_status: 'pending' }
    })

    return count
  } catch (error) {
    console.error('Get pending payments count error:', error)
    return 0
  }
}
