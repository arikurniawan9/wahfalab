'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { generateHandoverNumber } from '@/lib/utils/generateNumber'
import { createClient } from '@/lib/supabase/server'

export async function createSampleHandover(data: {
  job_order_id: string;
  sample_condition: string;
  sample_qty: number;
  notes?: string;
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Ambil profil analis (penerima)
    const analystProfile = await prisma.profile.findUnique({
      where: { email: user.email! }
    })

    if (!analystProfile) {
      return { error: 'Analyst profile not found' }
    }

    // Ambil job order untuk mendapatkan sender_id (field officer)
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: data.job_order_id },
      include: {
        sampling_assignment: true
      }
    })

    if (!jobOrder) {
      return { error: 'Job order not found' }
    }

    // Check if handover already exists
    const existingHandover = await prisma.sampleHandover.findUnique({
      where: { job_order_id: data.job_order_id }
    })

    if (existingHandover) {
      return { success: true, handover: serializeData(existingHandover), message: 'Serah terima sudah ada' }
    }

    const senderId = jobOrder.sampling_assignment?.field_officer_id

    if (!senderId) {
      return { error: 'Data petugas lapangan tidak ditemukan untuk serah terima ini' }
    }

    const handoverNumber = await generateHandoverNumber("BAST");

    const handover = await prisma.sampleHandover.create({
      data: {
        job_order_id: data.job_order_id,
        handover_number: handoverNumber,
        sender_id: senderId,
        receiver_id: analystProfile.id,
        sample_condition: data.sample_condition,
        sample_qty: data.sample_qty,
        sample_notes: data.notes,
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
        analyst_id: analystProfile.id,
        analysis_started_at: new Date()
      }
    });

    revalidatePath('/analyst');
    revalidatePath(`/analyst/jobs/${data.job_order_id}`);
    revalidatePath('/operator/jobs');

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
