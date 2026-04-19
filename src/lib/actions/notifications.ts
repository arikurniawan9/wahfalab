'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { auth } from '@/lib/auth'

export type NotificationType =
  | 'sampling_completed'
  | 'analysis_ready'
  | 'analysis_completed'
  | 'reporting_completed'
  | 'invoice_generated'
  | 'invoice_sent'
  | 'payment_received'
  | 'job_assigned'
  | 'approval_requested'
  | 'approval_decided'

interface CreateNotificationData {
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

/**
 * Create a single notification
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata || undefined
      }
    })

    revalidatePath('/api/notifications')
    return { success: true, notification }
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return { error: error.message }
  }
}

/**
 * Create multiple notifications at once
 */
export async function createNotifications(data: CreateNotificationData[]) {
  try {
    const notifications = await prisma.notification.createMany({
      data: data.map(d => ({
        user_id: d.user_id,
        type: d.type,
        title: d.title,
        message: d.message,
        link: d.link,
        metadata: d.metadata || undefined
      }))
    })

    revalidatePath('/api/notifications')
    return { success: true, count: notifications.count }
  } catch (error: any) {
    console.error('Error creating notifications:', error)
    return { error: error.message }
  }
}

/**
 * Get notifications for current user
 */
export async function getMyNotifications(page = 1, limit = 20, unreadOnly = false) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const skip = (page - 1) * limit
    const where = {
      user_id: profile?.id,
      ...(unreadOnly ? { is_read: false } : {})
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              full_name: true,
              email: true
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { user_id: profile?.id, is_read: false }
      })
    ])

    return serializeData({
      items: notifications,
      total,
      pages: Math.ceil(total / limit),
      unreadCount
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    
    // Handle database connection errors gracefully
    if (error?.message?.includes('Server has closed the connection') || 
        error?.message?.includes('database connection')) {
      return { 
        items: [], 
        total: 0, 
        pages: 0, 
        unreadCount: 0,
        error: 'Koneksi database terputus sementara. Mencoba menghubungkan kembali...' 
      }
    }
    
    return { error: error.message }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true }
    })

    revalidatePath('/api/notifications')
    return { success: true }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return { error: error.message }
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    await prisma.notification.updateMany({
      where: {
        user_id: profile?.id,
        is_read: false
      },
      data: {
        is_read: true
      }
    })

    revalidatePath('/api/notifications')
    return { success: true }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    return { error: error.message }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId }
    })

    revalidatePath('/api/notifications')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return { error: error.message }
  }
}

/**
 * Get notification stats for current user
 */
export async function getNotificationStats() {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    const [unreadCount, totalCount] = await Promise.all([
      prisma.notification.count({
        where: { user_id: profile?.id, is_read: false }
      }),
      prisma.notification.count({
        where: { user_id: profile?.id }
      })
    ])

    return {
      unreadCount,
      totalCount,
      readCount: totalCount - unreadCount
    }
  } catch (error: any) {
    console.error('Error fetching notification stats:', error)
    return { error: error.message }
  }
}

/**
 * Notify analysts when sampling is completed
 */
export async function notifySamplingCompleted(
  jobOrderId: string,
  trackingCode: string,
  analystId?: string
) {
  try {
    // Get all analysts if no specific analyst is assigned
    let targetUserIds: string[] = []

    if (analystId) {
      targetUserIds = [analystId]
    } else {
      const analysts = await prisma.profile.findMany({
        where: { role: 'analyst' },
        select: { id: true }
      })
      targetUserIds = analysts.map((a: any) => a.id)
    }

    // Also notify admin
    const admins = await prisma.profile.findMany({
      where: { role: 'admin' },
      select: { id: true }
    })
    targetUserIds = [...targetUserIds, ...admins.map((a: any) => a.id)]

    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      type: 'sampling_completed' as NotificationType,
      title: 'Sampling Selesai - Siap Analisis',
      message: `Sample ${trackingCode} telah selesai diambil dan siap untuk dianalisis`,
      link: `/analyst/jobs/${jobOrderId}`,
      metadata: { job_order_id: jobOrderId, tracking_code: trackingCode }
    }))

    return await createNotifications(notifications)
  } catch (error: any) {
    console.error('Error notifying sampling completion:', error)
    return { error: error.message }
  }
}

/**
 * Notify finance when invoice is generated
 */
export async function notifyInvoiceGenerated(
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  clientName: string
) {
  try {
    // Get all finance users
    const financeUsers = await prisma.profile.findMany({
      where: { role: 'finance' },
      select: { id: true }
    })

    // Also notify admin
    const admins = await prisma.profile.findMany({
      where: { role: 'admin' },
      select: { id: true }
    })

    const targetUserIds = [...financeUsers.map((f: any) => f.id), ...admins.map((a: any) => a.id)]

    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      type: 'invoice_generated' as NotificationType,
      title: 'Invoice Baru Dibuat',
      message: `Invoice ${invoiceNumber} untuk ${clientName} sebesar Rp ${amount.toLocaleString('id-ID')} menunggu review`,
      link: `/finance/invoices/${invoiceId}`,
      metadata: { invoice_id: invoiceId, invoice_number: invoiceNumber, amount }
    }))

    return await createNotifications(notifications)
  } catch (error: any) {
    console.error('Error notifying invoice generation:', error)
    return { error: error.message }
  }
}

/**
 * Notify client when invoice is sent
 */
export async function notifyInvoiceSent(
  clientId: string,
  invoiceNumber: string,
  amount: number
) {
  try {
    return await createNotification({
      user_id: clientId,
      type: 'invoice_sent',
      title: 'Invoice Dikirim',
      message: `Invoice ${invoiceNumber} sebesar Rp ${amount.toLocaleString('id-ID')} telah dikirim. Silakan lakukan pembayaran.`,
      link: '/client/invoices',
      metadata: { invoice_number: invoiceNumber, amount }
    })
  } catch (error: any) {
    console.error('Error notifying invoice sent:', error)
    return { error: error.message }
  }
}

/**
 * Notify when payment is received
 */
export async function notifyPaymentReceived(
  jobOrderId: string,
  trackingCode: string,
  amount: number
) {
  try {
    // Notify admin and finance
    const adminsAndFinance = await prisma.profile.findMany({
      where: {
        role: {
          in: ['admin', 'finance']
        }
      },
      select: { id: true }
    })

    const notifications = adminsAndFinance.map((user: any) => ({
      user_id: user.id,
      type: 'payment_received' as NotificationType,
      title: 'Pembayaran Diterima',
      message: `Pembayaran Rp ${amount.toLocaleString('id-ID')} untuk ${trackingCode} telah diterima`,
      link: `/finance/payments`,
      metadata: { job_order_id: jobOrderId, tracking_code: trackingCode, amount }
    }))

    return await createNotifications(notifications)
  } catch (error: any) {
    console.error('Error notifying payment received:', error)
    return { error: error.message }
  }
}

/**
 * Notify field officer and assistants when a job is assigned to them
 */
export async function notifyJobAssigned(
  userIds: string[],
  assignmentId: string,
  trackingCode: string,
  location: string
) {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'job_assigned' as NotificationType,
      title: 'Tugas Sampling Baru',
      message: `Anda telah ditugaskan untuk melakukan sampling ${trackingCode} di ${location}`,
      link: `/field/assignments/${assignmentId}`,
      metadata: { assignment_id: assignmentId, tracking_code: trackingCode }
    }))

    return await createNotifications(notifications)
  } catch (error: any) {
    console.error('Error notifying job assignment:', error)
    return { error: error.message }
  }
}
