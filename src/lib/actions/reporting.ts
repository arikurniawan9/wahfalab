"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit-log";
import { cache } from "react";

/**
 * Server Actions untuk Reporting Staff
 * Mengelola penerbitan Laporan Hasil Uji (LHU)
 */

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
 * Generate nomor LHU otomatis
 * Format: LHU/YYYY/MM/NNNN
 */
async function generateLHUNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Get last LHU number for this month
  const lastLHU = await prisma.jobOrder.findFirst({
    where: {
      reporting_done_at: {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(`${year}-${String(Number(month) + 1).padStart(2, "0")}-01`),
      },
      certificate_url: {
        not: null,
      },
    },
    orderBy: {
      reporting_done_at: "desc",
    },
  });

  let sequence = 1;
  if (lastLHU && lastLHU.certificate_url) {
    // Extract sequence from existing LHU number
    const match = lastLHU.certificate_url.match(/LHU\/\d+\/\d+\/(\d+)/);
    if (match) {
      sequence = Number(match[1]) + 1;
    }
  }

  return `LHU/${year}/${month}/${String(sequence).padStart(4, "0")}`;
}

/**
 * Assign staff reporting ke job order
 * Hanya bisa dilakukan oleh admin/operator
 */
export async function assignReportingToJob(
  jobOrderId: string,
  reportingId: string
) {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator"].includes(profile.role)) {
      throw new Error("Only admin/operator can assign reporting staff");
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    if (jobOrder.status !== "analysis_done") {
      throw new Error("Job order must be in analysis_done status");
    }

    const updated = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        reporting_id: reportingId,
        status: "reporting",
      },
    });

    await logAudit({
      action: "reporting_assigned",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { reporting_id: reportingId, status: "reporting" },
    });

    revalidatePath("/operator/jobs");
    revalidatePath("/reporting");

    return { success: true, jobOrder: updated };
  } catch (error) {
    console.error("Error assigning reporting:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to assign reporting staff",
    };
  }
}

/**
 * Mulai pekerjaan reporting untuk job order
 */
export async function startReporting(jobOrderId: string) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "reporting") {
      throw new Error("Only reporting staff can start reporting");
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    if (jobOrder.reporting_id !== profile.id) {
      throw new Error("You are not assigned to this job order");
    }

    const updated = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        status: "reporting",
      },
    });

    await logAudit({
      action: "reporting_started",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { status: "reporting" },
    });

    revalidatePath("/reporting");
    revalidatePath(`/reporting/jobs/${jobOrderId}`);

    return { success: true, jobOrder: updated };
  } catch (error) {
    console.error("Error starting reporting:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start reporting",
    };
  }
}

/**
 * Generate Laporan Hasil Uji (LHU) PDF
 */
export async function generateLabReport(jobOrderId: string) {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator", "reporting"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: {
        quotation: {
          include: {
            profile: true,
            items: {
              include: {
                service: true,
              },
            },
          },
        },
        lab_analysis: {
          include: {
            analyst: true,
          },
        },
        sampling_assignment: true,
      },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    if (!jobOrder.lab_analysis) {
      throw new Error("Lab analysis not found");
    }

    if (jobOrder.status !== "reporting" && jobOrder.status !== "analysis_done") {
      throw new Error("Job order must be in reporting or analysis_done status");
    }

    // Generate LHU number
    const lhuNumber = await generateLHUNumber();

    // TODO: Generate PDF using @react-pdf/renderer
    // For now, we'll just return the data
    const reportData = {
      lhuNumber,
      jobOrder,
      generatedAt: new Date(),
      generatedBy: profile,
    };

    return { success: true, report: reportData };
  } catch (error) {
    console.error("Error generating lab report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate lab report",
    };
  }
}

/**
 * Upload LHU PDF ke Supabase Storage
 */
export async function uploadLHUPDF(jobOrderId: string, formData: FormData) {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator", "reporting"].includes(profile.role)) {
      throw new Error("Unauthorized");
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

    // Generate LHU number
    const lhuNumber = await generateLHUNumber();

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
    const fileName = `LHU-${lhuNumber.replace(/\//g, "-")}.${fileExt}`;
    const { data: uploadData, error: uploadError } =
      await supabase.storage.from("lab-reports").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("lab-reports").getPublicUrl(uploadData.path);

    // Update job order
    const updated = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        certificate_url: publicUrl,
      },
    });

    await logAudit({
      action: "lhu_pdf_uploaded",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: { certificate_url: publicUrl, lhu_number: lhuNumber },
    });

    revalidatePath("/reporting");
    revalidatePath(`/reporting/jobs/${jobOrderId}`);
    revalidatePath("/operator/jobs");

    return { success: true, url: publicUrl, lhuNumber };
  } catch (error) {
    console.error("Error uploading LHU PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload LHU PDF",
    };
  }
}

/**
 * Terbitkan LHU dan selesaikan job order
 */
export async function publishLabReport(jobOrderId: string) {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator", "reporting"].includes(profile.role)) {
      throw new Error("Unauthorized");
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

    if (!jobOrder.certificate_url) {
      throw new Error("LHU PDF must be uploaded before publishing");
    }

    // Generate LHU number for record
    const lhuNumber = await generateLHUNumber();

    // Update job order status
    const updated = await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        status: "completed",
        reporting_done_at: new Date(),
        notes: `LHU Published: ${lhuNumber}`,
      },
    });

    await logAudit({
      action: "lhu_published",
      entity_type: "job_order",
      entity_id: jobOrderId,
      user_id: profile.id!,
      user_email: profile.email!,
      user_role: profile.role,
      new_data: {
        status: "completed",
        reporting_done_at: new Date(),
        lhu_number: lhuNumber,
      },
    });

    // TODO: Send notification to operator and client
    // await notifyOperator(jobOrderId);
    // await notifyClient(jobOrderId);

    revalidatePath("/reporting");
    revalidatePath("/operator/jobs");
    revalidatePath("/client/orders");

    return { success: true, jobOrder: updated, lhuNumber };
  } catch (error) {
    console.error("Error publishing lab report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish lab report",
    };
  }
}

/**
 * Get semua job orders untuk reporting yang sedang login
 */
export async function getMyReportingJobs(
  page = 1,
  limit = 10,
  status?: string
) {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "reporting") {
      throw new Error("Only reporting staff can access this");
    }

    const skip = (page - 1) * limit;

    const where: any = {
      reporting_id: profile.id,
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
          lab_analysis: {
            select: {
              id: true,
              analyst: {
                select: {
                  full_name: true,
                  email: true,
                },
              },
              analysis_completed_at: true,
              result_pdf_url: true,
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
    console.error("Error getting reporting jobs:", error);
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
 * Get job orders yang ready untuk reporting (status: analysis_done)
 * Untuk admin/operator
 */
export async function getJobsReadyForReporting(
  page = 1,
  limit = 10
) {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator"].includes(profile.role)) {
      throw new Error("Only admin/operator can access this");
    }

    const skip = (page - 1) * limit;

    const [jobOrders, total] = await Promise.all([
      prisma.jobOrder.findMany({
        where: {
          status: "analysis_done",
        },
        skip,
        take: limit,
        orderBy: { analysis_done_at: "desc" },
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
          lab_analysis: {
            select: {
              id: true,
              analyst: {
                select: {
                  full_name: true,
                  email: true,
                },
              },
              analysis_completed_at: true,
            },
          },
          sampling_assignment: {
            select: {
              field_officer: {
                select: {
                  full_name: true,
                },
              },
            },
          },
        },
      }),
      prisma.jobOrder.count({
        where: {
          status: "analysis_done",
        },
      }),
    ]);

    return {
      jobOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error getting jobs ready for reporting:", error);
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
 * Get detail job order untuk reporting
 */
export const getReportingJobById = cache(async (jobOrderId: string) => {
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
                service: true,
              },
            },
          },
        },
        lab_analysis: {
          include: {
            analyst: true,
          },
        },
        sampling_assignment: true,
      },
    });

    if (!jobOrder) {
      throw new Error("Job order not found");
    }

    // Check access
    const allowedRoles = ["admin", "operator", "reporting"];
    if (!allowedRoles.includes(profile!.role)) {
      throw new Error("Unauthorized");
    }

    if (profile!.role === "reporting" && jobOrder.reporting_id !== profile!.id) {
      throw new Error("You are not assigned to this job order");
    }

    return { jobOrder, success: true };
  } catch (error) {
    console.error("Error getting reporting job:", error);
    return {
      jobOrder: null,
      success: false,
      error: error instanceof Error ? error.message : "Failed to get job",
    };
  }
});

/**
 * Get statistik untuk dashboard reporting
 */
export async function getReportingDashboard() {
  try {
    const { profile } = await getCurrentUser();

    if (profile.role !== "reporting") {
      throw new Error("Only reporting staff can access this");
    }

    const [pending, inProgress, done, total] = await Promise.all([
      prisma.jobOrder.count({
        where: {
          reporting_id: profile.id,
          status: "analysis_done",
        },
      }),
      prisma.jobOrder.count({
        where: {
          reporting_id: profile.id,
          status: "reporting",
        },
      }),
      prisma.jobOrder.count({
        where: {
          reporting_id: profile.id,
          status: "completed",
        },
      }),
      prisma.jobOrder.count({
        where: {
          reporting_id: profile.id,
        },
      }),
    ]);

    const recentJobs = await prisma.jobOrder.findMany({
      where: { reporting_id: profile.id },
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
    console.error("Error getting reporting dashboard:", error);
    return {
      stats: { pending: 0, inProgress: 0, done: 0, total: 0 },
      recentJobs: [],
      error: error instanceof Error ? error.message : "Failed to get dashboard",
    };
  }
}

/**
 * Get all analysts untuk dropdown assignment
 */
export async function getAllAnalysts() {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator"].includes(profile.role)) {
      throw new Error("Only admin/operator can access this");
    }

    const analysts = await prisma.profile.findMany({
      where: {
        role: "analyst",
      },
      select: {
        id: true,
        full_name: true,
        email: true,
      },
      orderBy: {
        full_name: "asc",
      },
    });

    return { analysts, success: true };
  } catch (error) {
    console.error("Error getting analysts:", error);
    return {
      analysts: [],
      success: false,
      error: error instanceof Error ? error.message : "Failed to get analysts",
    };
  }
}

/**
 * Get all reporting staff untuk dropdown assignment
 */
export async function getAllReportingStaff() {
  try {
    const { profile } = await getCurrentUser();

    if (!["admin", "operator"].includes(profile.role)) {
      throw new Error("Only admin/operator can access this");
    }

    const staff = await prisma.profile.findMany({
      where: {
        role: "reporting",
      },
      select: {
        id: true,
        full_name: true,
        email: true,
      },
      orderBy: {
        full_name: "asc",
      },
    });

    return { staff, success: true };
  } catch (error) {
    console.error("Error getting reporting staff:", error);
    return {
      staff: [],
      success: false,
      error: error instanceof Error ? error.message : "Failed to get reporting staff",
    };
  }
}
