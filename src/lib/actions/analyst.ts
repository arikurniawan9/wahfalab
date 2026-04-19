"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit-log";
import { cache } from "react";
import { createNotifications } from "@/lib/actions/notifications";
import { serializeData } from "@/lib/utils/serialize";
import { STORAGE_BUCKETS, uploadToSupabaseStorage } from "@/lib/supabase/storage";

/**
 * Server Actions untuk Analyst (Analis Laboratorium)
 * Mengelola analisis sampel dari sampling hingga selesai
 */

// Types
export interface TestResult {
  parameter: string;
  result: string;
  unit: string;
  method: string;
  limit?: string;
  status?: "pass" | "fail";
}

export interface AnalysisData {
  test_results?: TestResult[];
  analysis_notes?: string;
  equipment_used?: string[];
  sample_condition?: string;
}

/**
 * Get profile user yang sedang login
 */
async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  return { session, profile };
}

/**
 * Assign analis ke job order
 * Hanya bisa dilakukan oleh admin/operator
 */
export async function assignAnalystToJob(
  jobOrderId: string,
  analystId: string
) {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator"].includes(profile.role)) {
      throw new Error("Only admin/operator can assign analyst");
    }

    const jobOrder = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        analyst_id: analystId,
        status: "analysis",
        analysis_started_at: new Date(),
      },
      include: {
        quotation: {
          include: {
            profile: true,
          },
        },
      },
    });

    await logAudit({
      action: "analyst_assigned",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { analyst_id: analystId, status: "analysis" },
    });

    revalidatePath("/operator/jobs");
    revalidatePath("/analyst");

    return { success: true, jobOrder };
  } catch (error) {
    console.error("Error assigning analyst:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign analyst",
    };
  }
}

/**
 * Mulai analisis untuk job order
 * Analis memulai pekerjaan analisis
 */
export async function startAnalysis(jobOrderId: string) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "analyst") {
      throw new Error("Only analyst can start analysis");
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: {
        sampling_assignment: true,
      },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    if (jobOrder.status !== "analysis_ready" && jobOrder.status !== "analysis") {
      throw new Error("Job order not ready for analysis");
    }

    const updated = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        status: "analysis",
        analysis_started_at: jobOrder.analysis_started_at || new Date(),
      },
    });

    await logAudit({
      action: "analysis_started",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { status: "analysis" },
    });

    revalidatePath("/analyst");
    revalidatePath(`/analyst/jobs/${jobOrderId}`);

    return { success: true, jobOrder: updated };
  } catch (error) {
    console.error("Error starting analysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start analysis",
    };
  }
}

/**
 * Simpan hasil analisis (Draft)
 */
export async function saveAnalysisResults(
  jobOrderId: string,
  data: AnalysisData
) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "analyst") {
      throw new Error("Only analyst can save analysis results");
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    // Upsert lab analysis
    const labAnalysis = await prisma.labAnalysis.upsert({
      where: { job_order_id: jobOrderId },
      create: {
        job_order_id: jobOrderId,
        analyst_id: profile.id!,
        test_results: data.test_results as any,
        analysis_notes: data.analysis_notes,
        equipment_used: data.equipment_used as any,
        sample_condition: data.sample_condition,
      },
      update: {
        test_results: data.test_results as any,
        analysis_notes: data.analysis_notes,
        equipment_used: data.equipment_used as any,
        sample_condition: data.sample_condition,
        updated_at: new Date(),
      },
    });

    await logAudit({
      action: "analysis_results_saved",
      entity_type: "lab_analysis",
      entity_id: labAnalysis.id,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: data,
    });

    revalidatePath("/analyst");
    revalidatePath(`/analyst/jobs/${jobOrderId}`);

    return { success: true, labAnalysis };
  } catch (error) {
    console.error("Error saving analysis results:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save analysis results",
    };
  }
}

/**
 * Upload Laporan Hasil Lab (PDF) ke Supabase Storage
 */
export async function uploadAnalysisPDF(
  jobOrderId: string,
  formData: FormData
) {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator", "analyst"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Get Job Order and Invoice details for naming
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: { 
        invoice: true,
        quotation: true
      }
    });

    if (!jobOrder) throw new Error("Job Order not found");

    const invoicePart = jobOrder.invoice?.invoice_number?.replace(/\//g, "-") || jobOrder.tracking_code;
    const renamedFile = new File([await file.arrayBuffer()], `LAPORAN-${invoicePart}.${file.name.split(".").pop()}`, {
      type: file.type,
    });
    const { publicUrl } = await uploadToSupabaseStorage({
      bucket: STORAGE_BUCKETS.labResults,
      folder: `analysis-pdf/${jobOrderId}`,
      file: renamedFile,
      allowedMimeTypes: ['application/pdf'],
      maxSizeBytes: 15 * 1024 * 1024,
    });

    // Update lab analysis
    const labAnalysis = await prisma.labAnalysis.upsert({
      where: { job_order_id: jobOrderId },
      create: {
        job_order_id: jobOrderId,
        analyst_id: profile.id!,
        result_pdf_url: publicUrl,
      },
      update: {
        result_pdf_url: publicUrl,
        updated_at: new Date(),
      },
    });

    await logAudit({
      action: "analysis_pdf_uploaded_supabase",
      entity_type: "lab_analysis",
      entity_id: labAnalysis.id,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { result_pdf_url: publicUrl, storage: "supabase" },
    });

    revalidatePath("/analyst");
    revalidatePath(`/analyst/jobs/${jobOrderId}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading analysis PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

/**
 * Upload data mentah (foto, dll) ke Supabase Storage
 */
export async function uploadRawData(
  jobOrderId: string,
  formData: FormData
) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "analyst") {
      throw new Error("Only analyst can upload raw data");
    }

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Get Job Order and Invoice details for naming
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: { 
        invoice: true,
        quotation: true
      }
    });

    if (!jobOrder) throw new Error("Job Order not found");

    const invoicePart = jobOrder.invoice?.invoice_number?.replace(/\//g, "-") || jobOrder.tracking_code;
    const renamedFile = new File([await file.arrayBuffer()], `RAW-${invoicePart}.${file.name.split(".").pop()}`, {
      type: file.type,
    });
    const { publicUrl } = await uploadToSupabaseStorage({
      bucket: STORAGE_BUCKETS.labResults,
      folder: `raw-data/${jobOrderId}`,
      file: renamedFile,
      allowedMimeTypes: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
      ],
      maxSizeBytes: 20 * 1024 * 1024,
    });

    // Update lab analysis
    const labAnalysis = await prisma.labAnalysis.upsert({
      where: { job_order_id: jobOrderId },
      create: {
        job_order_id: jobOrderId,
        analyst_id: profile.id!,
        raw_data_url: publicUrl,
      },
      update: {
        raw_data_url: publicUrl,
        updated_at: new Date(),
      },
    });

    await logAudit({
      action: "raw_data_uploaded_supabase",
      entity_type: "lab_analysis",
      entity_id: labAnalysis.id,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { raw_data_url: publicUrl, storage: "supabase" },
    });

    revalidatePath("/analyst");
    revalidatePath(`/analyst/jobs/${jobOrderId}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading raw data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

/**
 * Selesaikan analisis dan lanjut ke reporting
 * Akan mengirim notifikasi ke tim reporting
 */
export async function completeAnalysis(jobOrderId: string) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "analyst") {
      throw new Error("Only analyst can complete analysis");
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: {
        lab_analysis: true,
        quotation: {
          include: {
            profile: true
          }
        }
      },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    if (jobOrder.analyst_id !== profile.id) {
      throw new Error("You are not assigned to this job order");
    }

    // Update status to analysis_done (not reporting, as reporting needs to claim)
    const updated = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        status: "analysis_done", 
        analysis_done_at: new Date(),
        lab_analysis: {
          update: {
            analysis_completed_at: new Date(),
          },
        },
      },
      include: {
        quotation: {
          include: {
            profile: true
          }
        }
      }
    });

    // Get all reporting staff to notify
    const reportingStaff = await prisma.profile.findMany({
      where: { role: "reporting" },
    });

    // Send notifications to reporting team
    if (reportingStaff.length > 0) {
      const notifications = reportingStaff.map((staff: any) => ({
        user_id: staff.id!,
        type: 'analysis_completed' as any,
        title: 'Analisis Selesai - Siap Reporting',
        message: `Job Order ${updated.tracking_code} siap dibuatkan laporan hasil uji (LHU).`,
        link: `/reporting`, // Go to queue to claim
        metadata: {
          job_order_id: jobOrderId,
          tracking_code: updated.tracking_code,
          customer_name: updated.quotation?.profile?.company_name || updated.quotation?.profile?.full_name
        }
      }));

      // Use the helper for notifications to ensure revalidation
      await createNotifications(notifications);
    }

    revalidatePath("/analyst");
    revalidatePath("/operator/jobs");
    revalidatePath("/reporting");

    return { success: true, jobOrder: updated };
  } catch (error) {
    console.error("Error completing analysis:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to complete analysis",
    };
  }
}

/**
 * Get semua job orders untuk analis yang sedang login
 */
export async function getMyAnalysisJobs(
  page = 1,
  limit = 10,
  status?: string
) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "analyst") {
      throw new Error("Only analyst can access this");
    }

    const skip = (page - 1) * limit;

    const where: any = {
      analyst_id: profile.id,
    };

    if (status) {
      where.status = status;
    }

    const [jobOrders, total] = await Promise.all([
      prisma.jobOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          quotation: {
            select: {
              quotation_number: true,
              profile: {
                select: {
                  full_name: true,
                  company_name: true,
                },
              },
              items: {
                include: {
                  service: true
                }
              }
            },
          },
          sampling_assignment: {
            select: {
              id: true,
              field_officer_id: true,
              scheduled_date: true,
              actual_date: true,
              location: true,
              status: true,
              photos: true,
              notes: true,
            },
          },
          sample_handover: {
            include: {
              sender: { select: { full_name: true } },
              receiver: { select: { full_name: true } },
            }
          },
          lab_analysis: {
            select: {
              id: true,
              analysis_notes: true,
              sample_condition: true,
              result_pdf_url: true,
              analysis_completed_at: true,
            },
          },
        },
      }),
      prisma.jobOrder.count({ where }),
    ]);

    return serializeData({
      jobOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error getting analyst jobs:", error);
    return {
      jobOrders: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: error instanceof Error ? error.message : "Failed to get jobs",
    };
  }
}

/**
 * Get statistik untuk dashboard analis
 */
export async function getAnalystDashboard() {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "analyst") {
      throw new Error("Only analyst can access this");
    }

    const [pending, inProgress, done, total] = await Promise.all([
      prisma.jobOrder.count({
        where: {
          analyst_id: profile.id,
          status: "analysis_ready",
        },
      }),
      prisma.jobOrder.count({
        where: {
          analyst_id: profile.id,
          status: "analysis",
        },
      }),
      prisma.jobOrder.count({
        where: {
          analyst_id: profile.id,
          status: { in: ["analysis_done", "reporting", "completed"] },
        },
      }),
      prisma.jobOrder.count({
        where: {
          analyst_id: profile.id,
        },
      }),
    ]);

    const recentJobs = await prisma.jobOrder.findMany({
      where: { analyst_id: profile.id },
      take: 5,
      orderBy: { created_at: "desc" },
      include: {
        quotation: {
          select: {
            quotation_number: true,
            profile: {
              select: {
                full_name: true,
                company_name: true,
              },
            },
          },
        },
      },
    });

    return {
      stats: {
        pending,
        inProgress,
        done,
        total,
      },
      recentJobs,
    };
  } catch (error) {
    console.error("Error getting analyst dashboard:", error);
    return {
      stats: { pending: 0, inProgress: 0, done: 0, total: 0 },
      recentJobs: [],
      error: error instanceof Error ? error.message : "Failed to get dashboard",
    };
  }
}

/**
 * Get detail job order untuk analis
 */
export const getAnalysisJobById = cache(async (jobOrderId: string) => {
  try {
    const { profile } = await getCurrentUser();

    const [jobOrder, companyProfile] = await Promise.all([
      prisma.jobOrder.findUnique({
        where: { id: jobOrderId },
        include: {
          quotation: {
            include: {
              profile: true,
              items: {
                include: {
                  service: {
                    include: {
                      category_ref: true,
                      regulation_ref: true
                    }
                  },
                  equipment: true
                },
              },
            },
          },
          sampling_assignment: {
            include: {
              field_officer: true,
              travel_order: true,
            },
          },
          sample_handover: {
            include: {
              sender: { select: { full_name: true } },
              receiver: { select: { full_name: true } },
            }
          },
          lab_analysis: {
            include: {
              analyst: true
            }
          },
          invoice: {
            select: {
              invoice_number: true
            }
          }
        },
      }),
      prisma.companyProfile.findFirst()
    ]);

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    // Check access: analyst assigned, admin, or operator
    const allowedRoles = ["admin", "operator", "analyst"];
    if (!allowedRoles.includes(profile!.role)) {
      throw new Error("Unauthorized");
    }

    // Analysts can only access jobs assigned to them OR jobs ready for analysis (sampling/analysis_ready)
    if (profile!.role === "analyst") {
      const isAssigned = jobOrder.analyst_id === profile!.id;
      const isReadyForAnalysis = ["sampling", "analysis_ready"].includes(jobOrder.status);

      if (!isAssigned && !isReadyForAnalysis) {
        throw new Error("You are not assigned to this job order");
      }
    }

    // Return job order with serialized data
    return serializeData({ 
      success: true,
      jobOrder,
      companyProfile
    });
  } catch (error) {
    console.error("Error getting analysis job:", error);
    return {
      jobOrder: null,
      success: false,
      error: error instanceof Error ? error.message : "Failed to get job",
    };
  }
});
