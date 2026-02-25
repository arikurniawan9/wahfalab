'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { generateInvoiceNumber } from '@/lib/utils/generateNumber'

export async function createSampleHandover(data: {
  job_order_id: string;
  sender_id: string;
  receiver_id: string;
  sample_condition: string;
  sample_qty: number;
  sample_notes?: string;
}) {
  try {
    const handoverNumber = await generateInvoiceNumber("BAST");

    const handover = await prisma.sampleHandover.create({
      data: {
        job_order_id: data.job_order_id,
        handover_number: handoverNumber,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        sample_condition: data.sample_condition,
        sample_qty: data.sample_qty,
        sample_notes: data.sample_notes,
      },
      include: {
        sender: { select: { full_name: true, role: true } },
        receiver: { select: { full_name: true, role: true } },
        job_order: {
          include: {
            quotation: {
              include: {
                profile: { select: { company_name: true, full_name: true, email: true, phone: true } }
              }
            }
          }
        }
      }
    });

    // Update JobOrder status to 'analysis' when sample is received
    await prisma.jobOrder.update({
      where: { id: data.job_order_id },
      data: {
        status: 'analysis',
        analyst_id: data.receiver_id,
        analysis_started_at: new Date()
      }
    });

    revalidatePath('/analyst/jobs');
    revalidatePath('/operator/jobs');
    revalidatePath('/admin/jobs');

    return { success: true, handover: serializeData(handover) };
  } catch (error: any) {
    console.error('Create Handover Error:', error);
    return { error: error.message || 'Gagal membuat berita acara serah terima' };
  }
}

export async function getHandoverByJobId(jobOrderId: string) {
  try {
    const handover = await prisma.sampleHandover.findUnique({
      where: { job_order_id: jobOrderId },
      include: {
        sender: { select: { full_name: true, role: true } },
        receiver: { select: { full_name: true, role: true } },
        job_order: {
          include: {
            quotation: {
              include: {
                profile: { select: { company_name: true, full_name: true } }
              }
            }
          }
        }
      }
    });
    return serializeData(handover);
  } catch (error) {
    console.error('Get Handover Error:', error);
    return null;
  }
}
