'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { STORAGE_BUCKETS } from '@/lib/supabase/storage'
import { getCurrentProfile } from '@/lib/auth-helpers'
import { uploadManagedStorageFile } from '@/lib/storage/upload-router'

// --- REGULATION & BAKU MUTU ACTIONS ---

export async function getRegulations() {
  try {
    const items = await prisma.regulation.findMany({
      include: { _count: { select: { parameters: true } } },
      orderBy: { name: 'asc' }
    })
    return serializeData(items)
  } catch (error) {
    console.error('Get Regulations Error:', error)
    return []
  }
}

export async function getRegulationDetail(id: string) {
  try {
    const item = await prisma.regulation.findUnique({
      where: { id },
      include: { parameters: { orderBy: { sequence: 'asc' } } }
    })
    return serializeData(item)
  } catch (error) {
    console.error('Get Regulation Detail Error:', error)
    return null
  }
}

export async function createRegulation(data: any) {
  try {
    const item = await prisma.regulation.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        parameters: {
          create: data.parameters?.map((p: any, idx: number) => ({
            parameter: p.parameter,
            unit: p.unit,
            standard_value: p.standard_value,
            method: p.method,
            sequence: idx
          }))
        }
      }
    })
    revalidatePath('/reporting/regulations')
    return { success: true, id: item.id }
  } catch (error) {
    console.error('Create Regulation Error:', error)
    return { success: false, message: 'Gagal membuat regulasi' }
  }
}

export async function updateRegulation(id: string, data: any) {
  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Hapus parameter lama
      await tx.regulationParameter.deleteMany({
        where: { regulation_id: id }
      })

      // 2. Update data regulasi dan masukkan parameter baru
      await tx.regulation.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          parameters: {
            create: data.parameters?.map((p: any, idx: number) => ({
              parameter: p.parameter,
              unit: p.unit,
              standard_value: p.standard_value,
              method: p.method,
              sequence: idx
            }))
          }
        }
      })
    })

    revalidatePath('/reporting/regulations')
    revalidatePath(`/reporting/regulations/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Update Regulation Error:', error)
    return { success: false, message: 'Gagal memperbarui regulasi' }
  }
}

// --- LAB REPORT (LHU) ACTIONS ---

export async function getLabReports(options: { page?: number, limit?: number, search?: string, status?: string } = {}) {
  const { page = 1, limit = 10, search = '', status } = options
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { report_number: { contains: search, mode: 'insensitive' } },
      { client_name: { contains: search, mode: 'insensitive' } },
      { company_name: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [items, total] = await Promise.all([
      prisma.labReport.findMany({
        where,
        skip,
        take: limit,
        include: { regulation: { select: { name: true } } },
        orderBy: { created_at: 'desc' }
      }),
      prisma.labReport.count({ where })
    ])

    return serializeData({
      items,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Get Lab Reports Error:', error)
    return { items: [], total: 0, pages: 0 }
  }
}

export async function getLabReportById(id: string) {
  try {
    const item = await prisma.labReport.findUnique({
      where: { id },
      include: { 
        items: { orderBy: { sequence: 'asc' } },
        regulation: true
      }
    })
    return serializeData(item)
  } catch (error) {
    console.error('Get Lab Report Detail Error:', error)
    return null
  }
}

export async function createLabReport(data: any) {
  try {
    const report = await prisma.labReport.create({
      data: {
        report_number: data.report_number,
        sampling_date: data.sampling_date ? new Date(data.sampling_date) : null,
        received_date: data.received_date ? new Date(data.received_date) : null,
        analysis_date: data.analysis_date ? new Date(data.analysis_date) : null,
        client_name: data.client_name,
        company_name: data.company_name,
        address: data.address,
        sample_type: data.sample_type,
        sample_origin: data.sample_origin,
        sample_code: data.sample_code,
        regulation_id: data.regulation_id,
        status: 'draft',
        items: {
          create: data.items?.map((item: any, idx: number) => ({
            parameter: item.parameter,
            unit: item.unit,
            standard_value: item.standard_value,
            result_value: item.result_value,
            method: item.method,
            is_qualified: item.is_qualified,
            sequence: idx
          }))
        }
      }
    })
    revalidatePath('/reporting')
    return { success: true, id: report.id }
  } catch (error) {
    console.error('Create Lab Report Error:', error)
    return { success: false, message: 'Gagal membuat laporan hasil uji' }
  }
}

export async function updateLabReport(id: string, data: any) {
  try {
    await prisma.$transaction(async (tx: any) => {
      // Delete old items
      await tx.labReportItem.deleteMany({ where: { report_id: id } })
      
      // Update main data
      await tx.labReport.update({
        where: { id },
        data: {
          report_number: data.report_number,
          sampling_date: data.sampling_date ? new Date(data.sampling_date) : null,
          received_date: data.received_date ? new Date(data.received_date) : null,
          analysis_date: data.analysis_date ? new Date(data.analysis_date) : null,
          client_name: data.client_name,
          company_name: data.company_name,
          address: data.address,
          sample_type: data.sample_type,
          sample_origin: data.sample_origin,
          sample_code: data.sample_code,
          regulation_id: data.regulation_id,
          status: data.status || 'draft',
          items: {
            create: data.items?.map((item: any, idx: number) => ({
              parameter: item.parameter,
              unit: item.unit,
              standard_value: item.standard_value,
              result_value: item.result_value,
              method: item.method,
              is_qualified: item.is_qualified,
              sequence: idx
            }))
          }
        }
      })
    })
    revalidatePath('/reporting')
    revalidatePath(`/reporting/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Update Lab Report Error:', error)
    return { success: false, message: 'Gagal memperbarui laporan' }
  }
}

// --- JOB ORDER FOR REPORTING ACTIONS ---

// --- JOB ORDER FOR REPORTING ACTIONS ---

export async function getReportingJobById(id: string) {
  try {
    const item = await prisma.jobOrder.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            profile: {
              select: {
                full_name: true,
                company_name: true,
                address: true
              }
            },
            items: {
              include: {
                service: {
                  include: {
                    regulation_ref: true
                  }
                },
                equipment: true
              }
            }
          }
        },
        analyst: {
          select: {
            full_name: true,
            email: true
          }
        },
        invoice: true,
        lab_analysis: true,
        lab_report: {
          include: {
            items: {
              orderBy: { sequence: 'asc' }
            }
          }
        }
      }
    })
    return { success: true, jobOrder: serializeData(item) }
  } catch (error) {
    console.error('Get Reporting Job Detail Error:', error)
    return { success: false }
  }
}

export async function saveReportingResults(id: string, data: any) {
  try {
    const [profile, jobOrder] = await Promise.all([
      getCurrentProfile(),
      prisma.jobOrder.findUnique({
        where: { id },
        select: { analyst_id: true }
      })
    ])

    if (!jobOrder) {
      return { success: false, error: 'Pekerjaan tidak ditemukan' }
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.jobOrder.update({
        where: { id },
        data: { notes: data.analysis_notes }
      })

      const existingAnalysis = await tx.labAnalysis.findUnique({
        where: { job_order_id: id }
      })

      if (existingAnalysis) {
        await tx.labAnalysis.update({
          where: { job_order_id: id },
          data: {
            test_results: data.test_results,
            updated_at: new Date()
          }
        })
        return
      }

      const analystId = jobOrder.analyst_id || profile?.id
      if (!analystId) {
        throw new Error('Analis belum terhubung ke pekerjaan ini')
      }

      await tx.labAnalysis.create({
        data: {
          job_order_id: id,
          analyst_id: analystId,
          test_results: data.test_results
        }
      })
    })

    revalidatePath(`/reporting/jobs/${id}`)
    revalidatePath(`/analyst/jobs/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Save Reporting Results Error:', error)
    return { success: false, error: error?.message || 'Gagal menyimpan hasil' }
  }
}

export async function generateLHU(id: string) {
  try {
    const [jobOrder, companyProfile] = await Promise.all([
      prisma.jobOrder.findUnique({
        where: { id },
        include: {
          quotation: { include: { profile: true } },
          lab_analysis: {
            include: {
              analyst: {
                select: {
                  full_name: true,
                  email: true
                }
              }
            }
          },
          sampling_assignment: {
            include: {
              field_officer: {
                select: {
                  full_name: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.companyProfile.findFirst()
    ])

    if (!jobOrder) throw new Error("Pekerjaan tidak ditemukan")

    const lhuNumber = `LHU-${Date.now()}` // Dynamic number generation logic
    const now = new Date()
    
    const lhuData = {
      lhu_number: lhuNumber,
      tracking_code: jobOrder.tracking_code,
      quotation_number: jobOrder.quotation.quotation_number,
      issue_date: now.toISOString(),
      customer: {
        full_name: jobOrder.quotation.profile.full_name || jobOrder.quotation.profile.company_name || "-",
        company_name: jobOrder.quotation.profile.company_name,
        address: jobOrder.quotation.profile.address,
        phone: jobOrder.quotation.profile.phone,
        email: jobOrder.quotation.profile.email,
      },
      sampling: {
        location: jobOrder.sampling_assignment?.location || jobOrder.quotation.sampling_location || "-",
        date: (jobOrder.sampling_assignment?.actual_date || jobOrder.sampling_assignment?.scheduled_date || jobOrder.created_at).toISOString(),
        field_officer: jobOrder.sampling_assignment?.field_officer?.full_name || jobOrder.sampling_assignment?.field_officer?.email || "-",
      },
      analysis: {
        analyst_name: jobOrder.lab_analysis?.analyst?.full_name || jobOrder.lab_analysis?.analyst?.email || "-",
        start_date: (jobOrder.lab_analysis?.analysis_started_at || jobOrder.analysis_started_at || jobOrder.created_at).toISOString(),
        end_date: (jobOrder.lab_analysis?.analysis_completed_at || jobOrder.analysis_done_at || now).toISOString(),
        test_results: (jobOrder.lab_analysis?.test_results as any[]) || [],
        equipment_used: Array.isArray(jobOrder.lab_analysis?.equipment_used) ? jobOrder.lab_analysis.equipment_used : [],
        sample_condition: jobOrder.lab_analysis?.sample_condition || "-",
        notes: jobOrder.notes || jobOrder.lab_analysis?.analysis_notes || "",
      },
      company: {
        company_name: companyProfile?.company_name || "WahfaLab",
        address: companyProfile?.address || "",
        phone: companyProfile?.phone || companyProfile?.whatsapp || "",
        email: companyProfile?.email || "",
        logo_url: companyProfile?.logo_url || "/logo-wahfalab.png",
        tagline: companyProfile?.tagline || "Laboratorium Analisis Lingkungan",
        npwp: companyProfile?.npwp || "",
      }
    }

    return { success: true, lhuNumber, lhuData }
  } catch (error) {
    console.error('Generate LHU Error:', error)
    return { success: false, error: 'Gagal generate LHU' }
  }
}

export async function uploadLHUPDF(id: string, formData: FormData) {
  try {
    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new Error('File PDF tidak ditemukan')
    }

    const { publicUrl } = await uploadManagedStorageFile({
      bucket: STORAGE_BUCKETS.labResults,
      folder: `lhu/${id}`,
      file,
      allowedMimeTypes: ['application/pdf'],
      maxSizeBytes: 15 * 1024 * 1024,
    })

    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error('Upload LHU PDF Error:', error)
    return { success: false, error: error.message || 'Gagal upload LHU PDF' }
  }
}

export async function publishLabReportWithLHU(jobOrderId: string, certificateUrl: string, lhuNumber: string) {
  try {
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: {
        quotation: { include: { profile: true } },
        lab_analysis: true
      }
    })

    if (!jobOrder) throw new Error("Pekerjaan tidak ditemukan")

    await prisma.$transaction(async (tx: any) => {
      // 1. Update Job Order
      await tx.jobOrder.update({
        where: { id: jobOrderId },
        data: {
          status: 'completed',
          certificate_url: certificateUrl,
          reporting_done_at: new Date()
        }
      })

      // 2. Create official LabReport record
      await tx.labReport.create({
        data: {
          report_number: lhuNumber,
          job_order_id: jobOrderId,
          client_name: jobOrder.quotation.profile.full_name,
          company_name: jobOrder.quotation.profile.company_name,
          address: jobOrder.quotation.profile.address,
          status: 'final',
          items: {
            create: (jobOrder.lab_analysis?.test_results as any[])?.map((item: any, idx: number) => ({
              parameter: item.parameter,
              unit: item.unit,
              standard_value: item.limit || item.standard_value,
              result_value: item.result,
              method: item.method,
              is_qualified: item.qualification === 'pass' ? true : item.qualification === 'fail' ? false : null,
              sequence: idx
            }))
          }
        }
      })
    })

    revalidatePath('/reporting')
    revalidatePath(`/reporting/jobs/${jobOrderId}`)
    return { success: true }
  } catch (error) {
    console.error('Publish LHU Error:', error)
    return { success: false, error: 'Gagal menerbitkan LHU' }
  }
}

export async function getMyReportingJobs(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.jobOrder.findMany({
        where: {
          status: {
            in: ['analysis_done', 'reporting', 'completed']
          }
        },
        skip,
        take: limit,
        include: {
          quotation: {
            include: {
              profile: {
                select: {
                  full_name: true,
                  company_name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.jobOrder.count({
        where: {
          status: {
            in: ['analysis_done', 'reporting', 'completed']
          }
        }
      })
    ])

    return serializeData({
      jobOrders: items,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Get My Reporting Jobs Error:', error)
    return { jobOrders: [], total: 0, pages: 0 }
  }
}

export async function deleteLabReport(id: string) {
  try {
    await prisma.labReport.delete({ where: { id } })
    revalidatePath('/reporting')
    return { success: true }
  } catch (error) {
    console.error('Delete Lab Report Error:', error)
    return { success: false, message: 'Gagal menghapus laporan' }
  }
}
