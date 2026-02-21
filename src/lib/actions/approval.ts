'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function createApprovalRequest(data: {
  request_type: 'edit' | 'delete'
  entity_type: string
  entity_id: string
  requester_id: string
  reason: string
  old_data?: any
  new_data?: any
}) {
  try {
    const request = await prisma.approvalRequest.create({
      data: {
        request_type: data.request_type,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        requester_id: data.requester_id,
        reason: data.reason,
        old_data: data.old_data ? JSON.parse(JSON.stringify(data.old_data)) : undefined,
        new_data: data.new_data ? JSON.parse(JSON.stringify(data.new_data)) : undefined,
        status: 'pending'
      }
    })

    revalidatePath('/admin/approval-requests')
    revalidatePath('/operator/quotations')
    
    return { 
      success: true, 
      id: request.id,
      message: 'Permintaan persetujuan berhasil dibuat. Admin akan meninjau permintaan Anda.'
    }
  } catch (error) {
    console.error('Create Approval Request Error:', error)
    throw new Error('Gagal membuat permintaan persetujuan')
  }
}

export async function getApprovalRequests(page = 1, limit = 20, status = 'pending') {
  try {
    const skip = (page - 1) * limit
    
    const where: any = status === 'all' ? {} : { status }

    const [items, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        select: {
          id: true,
          request_type: true,
          status: true,
          entity_type: true,
          entity_id: true,
          reason: true,
          rejection_reason: true,
          created_at: true,
          reviewed_at: true,
          requester: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.approvalRequest.count({ where })
    ])

    return serializeData({ items, total, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Get Approval Requests Error:', error)
    throw new Error('Gagal mengambil permintaan persetujuan')
  }
}

export async function getPendingApprovalCount() {
  try {
    const count = await prisma.approvalRequest.count({
      where: { status: 'pending' }
    })
    return count
  } catch (error) {
    console.error('Get Pending Count Error:', error)
    return 0
  }
}

export async function approveRequest(requestId: string, reviewedBy: string) {
  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      throw new Error('Permintaan tidak ditemukan')
    }

    if (request.status !== 'pending') {
      throw new Error('Permintaan sudah diproses')
    }

    // Update request status
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date()
      }
    })

    // Execute the approved action
    if (request.request_type === 'delete') {
      if (request.entity_type === 'quotation') {
        // Delete quotation
        await prisma.quotation.delete({
          where: { id: request.entity_id }
        })
      }
    } else if (request.request_type === 'edit') {
      if (request.entity_type === 'quotation' && request.new_data) {
        // Update quotation with new data
        const newData = typeof request.new_data === 'string' 
          ? JSON.parse(request.new_data) 
          : request.new_data

        await prisma.quotation.update({
          where: { id: request.entity_id },
          data: newData
        })
      }
    }

    revalidatePath('/admin/approval-requests')
    revalidatePath('/operator/quotations')
    
    return { success: true, message: 'Permintaan berhasil disetujui' }
  } catch (error) {
    console.error('Approve Request Error:', error)
    throw new Error('Gagal menyetujui permintaan')
  }
}

export async function rejectRequest(requestId: string, reviewedBy: string, reason: string) {
  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      throw new Error('Permintaan tidak ditemukan')
    }

    if (request.status !== 'pending') {
      throw new Error('Permintaan sudah diproses')
    }

    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        rejection_reason: reason
      }
    })

    revalidatePath('/admin/approval-requests')
    revalidatePath('/operator/quotations')
    
    return { success: true, message: 'Permintaan ditolak' }
  } catch (error) {
    console.error('Reject Request Error:', error)
    throw new Error('Gagal menolak permintaan')
  }
}

export async function getQuotationForEdit(quotationId: string) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: {
        id: true,
        quotation_number: true,
        status: true,
        subtotal: true,
        discount_amount: true,
        use_tax: true,
        tax_amount: true,
        total_amount: true,
        perdiem_name: true,
        perdiem_price: true,
        perdiem_qty: true,
        transport_name: true,
        transport_price: true,
        transport_qty: true,
        user_id: true,
        profile: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        items: {
          select: {
            id: true,
            qty: true,
            price_snapshot: true,
            service: {
              select: {
                id: true,
                name: true
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
    })

    return serializeData(quotation)
  } catch (error) {
    console.error('Get Quotation Error:', error)
    throw new Error('Gagal mengambil data penawaran')
  }
}
