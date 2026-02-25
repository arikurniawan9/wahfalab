"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit-log";
import { cache } from "react";
import { createNotification } from "@/lib/actions/notifications";

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
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email! },
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

    if (jobOrder.analyst_id !== profile.id) {
      throw new Error("You are not assigned to this job order");
    }

    const updated = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        status: "analysis",
        analysis_started_at: new Date(),
      },
    });

    await logAudit({
      action: "analysis_started",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { status: "analysis", analysis_started_at: new Date() },
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
 * Simpan hasil analisis (draft)
 * Bisa dipanggil berkali-kali sebelum selesai
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

    if (jobOrder.analyst_id !== profile.id) {
      throw new Error("You are not assigned to this job order");
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
 * Upload PDF hasil analisis ke Supabase Storage
 */
export async function uploadAnalysisPDF(
  jobOrderId: string,
  formData: FormData
) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "analyst") {
      throw new Error("Only analyst can upload analysis PDF");
    }

    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file
    if (!file.type.includes("pdf")) {
      throw new Error("File must be a PDF");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB");
    }

    // Upload to Supabase Storage
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const fileExt = file.name.split(".").pop();
    const fileName = `${jobOrderId}-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } =
      await supabase.storage.from("analysis-results").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("analysis-results").getPublicUrl(uploadData.path);

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
      action: "analysis_pdf_uploaded",
      entity_type: "lab_analysis",
      entity_id: labAnalysis.id,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { result_pdf_url: publicUrl },
    });

    revalidatePath("/analyst");
    revalidatePath(`/analyst/jobs/${jobOrderId}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading analysis PDF:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload analysis PDF",
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
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file
    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      throw new Error("File must be an image or PDF");
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new Error("File size must be less than 20MB");
    }

    // Upload to Supabase Storage
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const fileExt = file.name.split(".").pop();
    const fileName = `${jobOrderId}-raw-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } =
      await supabase.storage.from("analysis-raw-data").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("analysis-raw-data")
      .getPublicUrl(uploadData.path);

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
      action: "raw_data_uploaded",
      entity_type: "lab_analysis",
      entity_id: labAnalysis.id,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { raw_data_url: publicUrl },
    });

    revalidatePath("/analyst");
    revalidatePath(`/analyst/jobs/${jobOrderId}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading raw data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload raw data",
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
      },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    if (jobOrder.analyst_id !== profile.id) {
      throw new Error("You are not assigned to this job order");
    }

    // Check if analysis results exist
    if (!jobOrder.lab_analysis) {
      throw new Error("Analysis results must be saved before completing");
    }

    // Update job order status
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

    await logAudit({
      action: "analysis_completed",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: {
        status: "analysis_done",
        analysis_done_at: new Date(),
      },
    });

    // Get reporting staff to send notification
    const reportingStaff = await prisma.profile.findFirst({
      where: { role: 'reporting' }
    });

    // Send notification to reporting team
    if (reportingStaff) {
      await createNotification({
        user_id: reportingStaff.id!,
        type: 'analysis_completed',
        title: 'Analisis Selesai - Siap untuk Reporting',
        message: `Job Order ${updated.tracking_code} telah selesai dianalisis. Silakan buat laporan hasil uji.`,
        link: `/reporting/jobs/${jobOrderId}`,
        metadata: {
          job_order_id: jobOrderId,
          tracking_code: updated.tracking_code,
          quotation_number: updated.quotation?.quotation_number,
          customer_name: updated.quotation?.profile?.full_name
        }
      });
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
      OR: [
        { analyst_id: profile.id },
        { status: 'sampling' },
        { status: 'analysis_ready' } // NEW: Show jobs ready for analysis
      ]
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
              photos: true, // Include sampling photos
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

    return {
      jobOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error getting analysis jobs:", error);
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
 * Get detail job order untuk analis
 */
export const getAnalysisJobById = cache(async (jobOrderId: string) => {
  try {
    const { profile } = await getCurrentUser();

    const jobOrder = await prisma.jobOrder.findUnique({
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
        lab_analysis: true,
      },
    });

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
    return { 
      jobOrder: {
        ...jobOrder,
        sample_handover: jobOrder.sample_handover,
        lab_analysis: jobOrder.lab_analysis,
        quotation: jobOrder.quotation,
        sampling_assignment: jobOrder.sampling_assignment,
      }, 
      success: true 
    };
  } catch (error) {
    console.error("Error getting analysis job:", error);
    return {
      jobOrder: null,
      success: false,
      error: error instanceof Error ? error.message : "Failed to get job",
    };
  }
});

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
          status: {
            in: ["analysis", "sampling"],
          },
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
          status: {
            in: ["analysis_done", "reporting", "completed"],
          },
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
