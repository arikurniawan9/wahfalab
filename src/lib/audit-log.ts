/**
 * Audit Logging Utility for WahfaLab
 * 
 * Tracks all important actions in the system for security,
 * compliance, and debugging purposes.
 * 
 * Usage:
 * ```typescript
 * await logAudit({
 *   action: 'create',
 *   entity_type: 'quotation',
 *   entity_id: quotation.id,
 *   new_data: quotation,
 *   metadata: { total_amount: 1000000 }
 * })
 * ```
 */

import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

interface AuditLogInput {
  action: string
  entity_type: string
  entity_id?: string
  user_id?: string
  user_email?: string
  user_role?: string
  old_data?: any
  new_data?: any
  metadata?: any
}

/**
 * Get client IP from headers
 */
function getClientIp(headersList: Headers): string | undefined {
  return (
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    undefined
  )
}

/**
 * Get user agent from headers
 */
function getUserAgent(headersList: Headers): string | undefined {
  return headersList.get('user-agent') || undefined
}

/**
 * Get current user info from Supabase session
 */
async function getCurrentUser() {
  try {
    const headersList = await headers()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Convert Headers to cookie format
            const cookies: { name: string; value: string }[] = []
            headersList.forEach((value, name) => {
              if (name.startsWith('sb-')) {
                cookies.push({ name, value })
              }
            })
            return cookies
          },
          setAll() {
            // No-op for server-side
          }
        }
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null
    
    // Get user profile with role
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true
      }
    })
    
    return profile
  } catch (error) {
    console.error('Get user for audit error:', error)
    return null
  }
}

/**
 * Create an audit log entry
 */
export async function logAudit(input: AuditLogInput) {
  try {
    const headersList = await headers()
    const user = input.user_id ? await getCurrentUser() : null
    
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        user_id: user?.id || input.user_id,
        user_email: user?.email || input.user_email,
        user_role: user?.role || input.user_role,
        ip_address: getClientIp(headersList),
        user_agent: getUserAgent(headersList),
        old_data: input.old_data ? sanitizeData(input.old_data) : null,
        new_data: input.new_data ? sanitizeData(input.new_data) : null,
        metadata: input.metadata
      }
    })
  } catch (error) {
    // Don't throw error for audit logging failures
    // We don't want to break the main operation
    console.error('Audit log error:', error)
  }
}

/**
 * Sanitize sensitive data before storing in audit log
 */
function sanitizeData(data: any): any {
  if (!data) return data
  
  const sanitized = { ...data }
  
  // Remove sensitive fields
  delete sanitized.password
  delete sanitized.hashedPassword
  delete sanitized.token
  delete sanitized.apiKey
  delete sanitized.secret
  
  return sanitized
}

/**
 * Audit log helpers for common actions
 */
export const audit = {
  // Generic log
  logAudit: (input: AuditLogInput) => logAudit(input),
  
  // Quotations
  createQuotation: (quotation: any) =>
    logAudit({
      action: 'create',
      entity_type: 'quotation',
      entity_id: quotation.id,
      new_data: quotation,
      metadata: { total_amount: quotation.total_amount }
    }),
  
  updateQuotation: (oldData: any, newData: any) =>
    logAudit({
      action: 'update',
      entity_type: 'quotation',
      entity_id: newData.id,
      old_data: oldData,
      new_data: newData,
      metadata: { 
        changes: {
          status: { from: oldData.status, to: newData.status },
          total_amount: { from: oldData.total_amount, to: newData.total_amount }
        }
      }
    }),
  
  deleteQuotation: (quotation: any) =>
    logAudit({
      action: 'delete',
      entity_type: 'quotation',
      entity_id: quotation.id,
      old_data: quotation,
      metadata: { quotation_number: quotation.quotation_number }
    }),
  
  // Job Orders
  createJobOrder: (jobOrder: any) =>
    logAudit({
      action: 'create',
      entity_type: 'job_order',
      entity_id: jobOrder.id,
      new_data: jobOrder,
      metadata: { tracking_code: jobOrder.tracking_code }
    }),
  
  updateJobStatus: (jobOrder: any, oldStatus: string, newStatus: string) =>
    logAudit({
      action: 'update_status',
      entity_type: 'job_order',
      entity_id: jobOrder.id,
      old_data: { status: oldStatus },
      new_data: { status: newStatus },
      metadata: { tracking_code: jobOrder.tracking_code }
    }),
  
  // Sampling Assignments
  createSamplingAssignment: (assignment: any) =>
    logAudit({
      action: 'create',
      entity_type: 'sampling_assignment',
      entity_id: assignment.id,
      new_data: assignment,
      metadata: { field_officer_id: assignment.field_officer_id }
    }),
  
  updateSamplingStatus: (assignment: any, oldStatus: string, newStatus: string) =>
    logAudit({
      action: 'update_status',
      entity_type: 'sampling_assignment',
      entity_id: assignment.id,
      old_data: { status: oldStatus },
      new_data: { status: newStatus }
    }),
  
  // Travel Orders
  createTravelOrder: (travelOrder: any) =>
    logAudit({
      action: 'create',
      entity_type: 'travel_order',
      entity_id: travelOrder.id,
      new_data: travelOrder,
      metadata: { document_number: travelOrder.document_number }
    }),
  
  // Authentication
  login: (user: any, success: boolean) =>
    logAudit({
      action: success ? 'login' : 'login_failed',
      entity_type: 'user',
      user_id: user.id,
      user_email: user.email,
      metadata: { success }
    }),
  
  logout: (user: any) =>
    logAudit({
      action: 'logout',
      entity_type: 'user',
      user_id: user.id,
      user_email: user.email
    }),
  
  // User Management
  createUser: (user: any) =>
    logAudit({
      action: 'create',
      entity_type: 'user',
      entity_id: user.id,
      new_data: { email: user.email, role: user.role }
    }),
  
  updateUserRole: (user: any, oldRole: string, newRole: string) =>
    logAudit({
      action: 'update_role',
      entity_type: 'user',
      entity_id: user.id,
      old_data: { role: oldRole },
      new_data: { role: newRole }
    }),
}

/**
 * Query audit logs (for admin dashboard)
 */
export async function getAuditLogs(filters?: {
  user_id?: string
  entity_type?: string
  entity_id?: string
  action?: string
  date_from?: Date
  date_to?: Date
  limit?: number
  page?: number
}) {
  const where: any = {}
  
  if (filters?.user_id) where.user_id = filters.user_id
  if (filters?.entity_type) where.entity_type = filters.entity_type
  if (filters?.entity_id) where.entity_id = filters.entity_id
  if (filters?.action) where.action = filters.action
  if (filters?.date_from || filters?.date_to) {
    where.created_at = {}
    if (filters.date_from) where.created_at.gte = filters.date_from
    if (filters.date_to) where.created_at.lte = filters.date_to
  }
  
  const limit = filters?.limit || 50
  const page = filters?.page || 1
  const skip = (page - 1) * limit
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        user_id: true,
        user_email: true,
        user_role: true,
        ip_address: true,
        created_at: true,
        metadata: true
      }
    }),
    prisma.auditLog.count({ where })
  ])
  
  return {
    logs,
    total,
    pages: Math.ceil(total / limit)
  }
}
