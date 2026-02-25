'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { createClient } from '@/lib/supabase/server'

/**
 * Get invoice by ID with full details
 */
export async function getInvoiceById(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
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
      where: { id: user.id },
      select: { role: true }
    })

    if (profile?.role !== 'admin' && profile?.role !== 'finance') {
      // Field officer can only view invoices from their assignments
      const assignment = await prisma.samplingAssignment.findFirst({
        where: {
          field_officer_id: user.id,
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

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

    revalidatePath('/finance')
    revalidatePath('/finance/invoices')
    revalidatePath('/finance/invoices/[id]')

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

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

    // TODO: Implement actual email sending here
    // For now, we just mark it as sent

    revalidatePath('/finance')
    revalidatePath('/finance/invoices')

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
 * Get invoice statistics
 */
export async function getInvoiceStats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

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
