'use server'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { auth } from '@/lib/auth'
import { isFinancePeriodLocked } from '@/lib/actions/finance'
import { STORAGE_BUCKETS, uploadToSupabaseStorage } from '@/lib/supabase/storage'

/**
 * Get invoice by ID with full details
 */
export async function getInvoiceById(invoiceId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: 'Unauthorized' }
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        job_order: {
          include: {
            quotation: {
              include: {
                profile: true,
                items: {
                  include: {
                    service: true,
                    equipment: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return { error: 'Invoice not found' }
    }

    // Check permissions - only admin, finance, or related field officer can view
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { role: true, id: true }
    })

    if (profile?.role !== 'admin' && profile?.role !== 'finance') {
      // Field officer can only view invoices from their assignments
      const assignment = await prisma.samplingAssignment.findFirst({
        where: {
          field_officer_id: profile.id,
          job_order_id: invoice.job_order_id
        }
      })

      if (!assignment) {
        return { error: 'Forbidden' }
      }
    }

    return serializeData(invoice)
  } catch (error: any) {
    console.error('Get invoice error:', error)
    return { error: error.message }
  }
}

/**
 * Get all invoices with pagination and filtering
 */
export async function getAllInvoices(page = 1, limit = 10, status?: string, search?: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const skip = (page - 1) * limit
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' as const } },
        { job_order: { tracking_code: { contains: search, mode: 'insensitive' as const } } },
        { job_order: { quotation: { profile: { full_name: { contains: search, mode: 'insensitive' as const } } } } }
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
      prisma.invoice.count({ where })
    ])

    return serializeData({ items: invoices, total, pages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('Get all invoices error:', error)
    return { error: error.message }
  }
}

/**
 * Get invoices by customer ID (profile)
 */
export async function getInvoicesByCustomerId(customerId: string, page = 1, limit = 10) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          job_order: {
            quotation: {
              profile: {
                id: customerId
              }
            }
          }
        },
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
      prisma.invoice.count({
        where: {
          job_order: {
            quotation: {
              profile: {
                id: customerId
              }
            }
          }
        }
      })
    ])

    return serializeData({ items: invoices, total, pages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('Get customer invoices error:', error)
    return { error: error.message }
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(invoiceId: string, status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status as any,
        updated_at: new Date()
      },
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

    const paths = [
      '/finance',
      '/finance/invoices',
      '/finance/invoices/[id]',
      '/admin/finance',
      '/admin/finance/invoices',
      '/admin/finance/invoices/[id]'
    ]
    paths.forEach((path) => revalidatePath(path))

    return serializeData(invoice)
  } catch (error: any) {
    console.error('Update invoice status error:', error)
    return { error: error.message }
  }
}

/**
 * Send invoice to customer (mark as sent)
 */
export async function sendInvoiceToCustomer(invoiceId: string, customerEmail: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    // Update invoice status to sent
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        updated_at: new Date()
      },
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

    // Create notification for customer
    await prisma.notification.create({
      data: {
        user_id: invoice.job_order.quotation.profile.id,
        type: 'invoice_sent',
        title: 'Invoice Baru Tersedia',
        message: `Invoice ${invoice.invoice_number} telah diterbitkan. Silakan periksa dashboard Anda.`,
        link: `/dashboard/orders`, // Customer typically sees invoices in order history
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          amount: Number(invoice.amount)
        }
      }
    })

    const paths = [
      '/finance',
      '/finance/invoices',
      '/admin/finance',
      '/admin/finance/invoices',
      '/dashboard',
      '/api/notifications'
    ]
    paths.forEach((path) => revalidatePath(path))

    return {
      success: true,
      invoice: serializeData(invoice),
      message: `Invoice sent to ${customerEmail}`
    }
  } catch (error: any) {
    console.error('Send invoice error:', error)
    return { error: error.message }
  }
}

/**
 * Submit payment proof (Customer Action)
 */
export async function submitPaymentProof(invoiceId: string, proofUrl: string, reference: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        job_order: { 
          include: { 
            quotation: { 
              include: { profile: true } 
            } 
          } 
        } 
      }
    })

    if (!invoice) return { error: 'Invoice tidak ditemukan' }

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { invoice_id: invoiceId },
      update: {
        payment_proof_url: proofUrl,
        transfer_reference: reference,
        payment_status: 'pending',
        payment_method: 'transfer'
      },
      create: {
        job_order_id: invoice.job_order_id,
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        payment_proof_url: proofUrl,
        transfer_reference: reference,
        payment_status: 'pending',
        payment_method: 'transfer'
      }
    })

    // Notify Finance and Admin
    const adminsAndFinance = await prisma.profile.findMany({
      where: { role: { in: ['admin', 'finance'] } },
      select: { id: true }
    })

    const notifications = adminsAndFinance.map((staff: any) => ({
      user_id: staff.id,
      type: 'payment_received' as any,
      title: 'Bukti Transfer Baru',
      message: `Customer ${invoice.job_order.quotation.profile.full_name} telah mengunggah bukti transfer untuk Invoice ${invoice.invoice_number}.`,
      link: `/finance/payments`,
      metadata: { invoice_id: invoiceId, payment_id: payment.id }
    }))

    await prisma.notification.createMany({ data: notifications })

    revalidatePath('/dashboard/orders')
    revalidatePath('/finance/payments')

    return { success: true }
  } catch (error: any) {
    console.error('Submit payment error:', error)
    return { error: error.message }
  }
}

export async function getPendingInvoiceRequests(page = 1, limit = 10, search?: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }

    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    })

    if (!profile || !['admin', 'finance'].includes(profile.role)) {
      return { error: 'Forbidden' }
    }

    const skip = (page - 1) * limit
    const where: any = {
      notes: { contains: '[INVOICE_REQUESTED]' },
      invoice: null
    }

    if (search) {
      where.OR = [
        { tracking_code: { contains: search, mode: 'insensitive' as const } },
        { quotation: { quotation_number: { contains: search, mode: 'insensitive' as const } } },
        { quotation: { profile: { full_name: { contains: search, mode: 'insensitive' as const } } } },
        { quotation: { profile: { company_name: { contains: search, mode: 'insensitive' as const } } } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.jobOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          quotation: {
            include: {
              profile: true
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
    })
  } catch (error: any) {
    console.error('Get pending invoice requests error:', error)
    return { error: error.message }
  }
}

export async function uploadPaymentProofFile(invoiceId: string, file: File) {
  try {
    const session = await auth()
    if (!session?.user?.email) return { error: 'Unauthorized' }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { invoice_number: true }
    })

    if (!invoice) {
      return { error: 'Invoice tidak ditemukan' }
    }

    const fileExt = file.name.split('.').pop() || 'bin'
    const renamedFile = new File(
      [await file.arrayBuffer()],
      `proof-${invoice.invoice_number.replace(/\//g, '-')}.${fileExt}`,
      { type: file.type }
    )

    const { publicUrl } = await uploadToSupabaseStorage({
      bucket: STORAGE_BUCKETS.paymentProofs,
      folder: `invoice/${invoiceId}`,
      file: renamedFile,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'],
      maxSizeBytes: 10 * 1024 * 1024,
    })

    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error('Upload payment proof error:', error)
    return { error: error.message }
  }
}

/**
 * Verify Payment (Finance Action)
 */
export async function verifyPayment(paymentId: string, isApproved: boolean, bankAccountId?: string, notes?: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!profile || !['admin', 'finance'].includes(profile.role)) {
      return { error: 'Forbidden' }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { 
        invoice: { 
          include: { 
            job_order: { 
              include: { 
                quotation: { 
                  include: { profile: true } 
                } 
              } 
            } 
          } 
        } 
      }
    })

    if (!payment || !payment.invoice) return { error: 'Data pembayaran tidak lengkap' }
    if (isApproved && !bankAccountId) return { error: 'Bank tujuan wajib dipilih untuk pembayaran transfer' }
    if (isApproved) {
      const periodLock = await isFinancePeriodLocked(new Date()) as any
      if (periodLock?.isLocked) {
        const reasonText = periodLock.reason ? ` Alasan: ${periodLock.reason}.` : ''
        return {
          error: `Periode ${periodLock.period} sedang dikunci.${reasonText} Verifikasi pembayaran tidak dapat diposting.`
        }
      }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (isApproved) {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            payment_status: 'paid',
            paid_at: new Date(),
            handled_by: profile.id,
            bank_account_id: bankAccountId
          }
        })

        await tx.invoice.update({
          where: { id: payment.invoice_id! },
          data: { status: 'paid', paid_at: new Date() }
        })

        await tx.financialRecord.create({
          data: {
            type: 'income',
            category: 'lab_service',
            amount: payment.amount,
            description: `Pemasukan Lab: Invoice ${payment.invoice_number}`,
            reference_id: payment.invoice_id,
            recorded_by: profile.id,
            bank_account_id: bankAccountId,
            transaction_date: new Date()
          }
        })

        if (bankAccountId) {
          await tx.bankAccount.update({
            where: { id: bankAccountId },
            data: { balance: { increment: payment.amount } }
          })
        }

        await tx.notification.create({
          data: {
            user_id: payment.invoice.job_order.quotation.profile.id,
            type: 'payment_received' as any,
            title: 'Pembayaran Dikonfirmasi',
            message: `Pembayaran Anda untuk Invoice ${payment.invoice_number} telah dikonfirmasi. Terima kasih!`,
            link: '/dashboard/orders'
          }
        })
      } else {
        await tx.payment.update({
          where: { id: paymentId },
          data: { payment_status: 'cancelled' }
        })

        await tx.notification.create({
          data: {
            user_id: payment.invoice.job_order.quotation.profile.id,
            type: 'approval_decided' as any,
            title: 'Pembayaran Ditolak',
            message: `Bukti transfer untuk Invoice ${payment.invoice_number} ditolak. Alasan: ${notes || 'Data tidak valid'}. Silakan upload ulang.`,
            link: '/dashboard/orders'
          }
        })
      }
    })

    const paths = [
      '/finance/payments',
      '/admin/finance/payments',
      '/dashboard/orders',
      '/finance',
      '/admin/finance',
      '/finance/transactions',
      '/admin/finance/transactions',
      '/finance/cashflow',
      '/admin/finance/cashflow'
    ]
    paths.forEach((path) => revalidatePath(path))

    return { success: true }
  } catch (error: any) {
    console.error('Verify payment error:', error)
    return { error: error.message }
  }
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats() {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const [total, draft, sent, paid, overdue] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'draft' } }),
      prisma.invoice.count({ where: { status: 'sent' } }),
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.invoice.count({
        where: {
          status: { in: ['sent', 'draft'] },
          due_date: { lt: new Date() }
        }
      })
    ])

    const totalAmount = await prisma.invoice.aggregate({
      _sum: { amount: true }
    })

    const paidAmount = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' }
    })

    const pendingAmount = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['sent', 'draft'] } }
    })

    return serializeData({
      total,
      draft,
      sent,
      paid,
      overdue,
      totalAmount: Number(totalAmount._sum.amount || 0),
      paidAmount: Number(paidAmount._sum.amount || 0),
      pendingAmount: Number(pendingAmount._sum.amount || 0)
    })
  } catch (error: any) {
    console.error('Get invoice stats error:', error)
    return { error: error.message }
  }
}
