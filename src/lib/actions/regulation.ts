"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getProfile } from "./auth";

/**
 * Server Actions untuk Regulasi
 * CRUD operations untuk Regulation dan RegulationParameter
 */

// Types
export interface RegulationParameterInput {
  parameter_name: string;
  method?: string;
  unit?: string;
  limit_min?: string;
  limit_max?: string;
  limit_value?: string;
  requirements?: string;
  sequence?: number;
  is_mandatory?: boolean;
  notes?: string;
}

export interface RegulationInput {
  name: string;
  code?: string;
  description?: string;
  published_date?: string;
  effective_date?: string;
  status?: string;
  parameters?: RegulationParameterInput[];
}

/**
 * Get semua regulasi
 */
export async function getRegulations(page = 1, limit = 20, search = "", status = "all") {
  try {
    const profile = await getProfile();
    
    if (!profile || !["admin", "operator"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;

    const where: any = {};

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by status
    if (status !== "all") {
      where.status = status;
    }

    const [regulations, total] = await Promise.all([
      prisma.regulation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          parameters: {
            orderBy: { sequence: "asc" },
          },
          _count: {
            select: { parameters: true, services: true },
          },
        },
      }),
      prisma.regulation.count({ where }),
    ]);

    return {
      items: regulations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("Error getting regulations:", error);
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      error: error.message,
    };
  }
}

/**
 * Get regulasi by ID dengan parameters
 */
export async function getRegulationById(id: string) {
  try {
    const profile = await getProfile();
    
    if (!profile) {
      throw new Error("Unauthorized");
    }

    const regulation = await prisma.regulation.findUnique({
      where: { id },
      include: {
        parameters: {
          orderBy: { sequence: "asc" },
        },
        services: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!regulation) {
      throw new Error("Regulation not found");
    }

    return { regulation, success: true };
  } catch (error: any) {
    console.error("Error getting regulation:", error);
    return {
      regulation: null,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create atau update regulasi
 */
export async function createOrUpdateRegulation(data: RegulationInput, id?: string) {
  try {
    const profile = await getProfile();
    
    if (!profile || !["admin", "operator"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    if (id) {
      // Update existing
      const regulation = await prisma.regulation.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          published_date: data.published_date ? new Date(data.published_date) : undefined,
          effective_date: data.effective_date ? new Date(data.effective_date) : undefined,
          status: data.status || "active",
          updated_at: new Date(),
        },
      });

      revalidatePath("/admin/regulations");
      return { success: true, regulation };
    } else {
      // Create new
      const regulation = await prisma.regulation.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          published_date: data.published_date ? new Date(data.published_date) : undefined,
          effective_date: data.effective_date ? new Date(data.effective_date) : undefined,
          status: data.status || "active",
        },
      });

      revalidatePath("/admin/regulations");
      return { success: true, regulation };
    }
  } catch (error: any) {
    console.error("Error creating/updating regulation:", error);
    return {
      success: false,
      error: error.message || "Gagal menyimpan regulasi",
    };
  }
}

/**
 * Create atau update parameter regulasi
 */
export async function createOrUpdateRegulationParameter(
  regulationId: string,
  data: RegulationParameterInput,
  parameterId?: string
) {
  try {
    const profile = await getProfile();
    
    if (!profile || !["admin", "operator"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    if (parameterId) {
      // Update existing parameter
      const parameter = await prisma.regulationParameter.update({
        where: { id: parameterId },
        data: {
          parameter_name: data.parameter_name,
          method: data.method,
          unit: data.unit,
          limit_min: data.limit_min,
          limit_max: data.limit_max,
          limit_value: data.limit_value,
          requirements: data.requirements,
          sequence: data.sequence || 0,
          is_mandatory: data.is_mandatory,
          notes: data.notes,
          updated_at: new Date(),
        },
      });

      revalidatePath("/admin/regulations");
      return { success: true, parameter };
    } else {
      // Create new parameter
      const parameter = await prisma.regulationParameter.create({
        data: {
          regulation_id: regulationId,
          parameter_name: data.parameter_name,
          method: data.method,
          unit: data.unit,
          limit_min: data.limit_min,
          limit_max: data.limit_max,
          limit_value: data.limit_value,
          requirements: data.requirements,
          sequence: data.sequence || 0,
          is_mandatory: data.is_mandatory !== false,
          notes: data.notes,
        },
      });

      revalidatePath("/admin/regulations");
      return { success: true, parameter };
    }
  } catch (error: any) {
    console.error("Error creating/updating parameter:", error);
    return {
      success: false,
      error: error.message || "Gagal menyimpan parameter",
    };
  }
}

/**
 * Delete parameter regulasi
 */
export async function deleteRegulationParameter(parameterId: string) {
  try {
    const profile = await getProfile();
    
    if (!profile || !["admin", "operator"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    await prisma.regulationParameter.delete({
      where: { id: parameterId },
    });

    revalidatePath("/admin/regulations");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting parameter:", error);
    return {
      success: false,
      error: error.message || "Gagal menghapus parameter",
    };
  }
}

/**
 * Delete regulasi
 */
export async function deleteRegulation(id: string) {
  try {
    const profile = await getProfile();
    
    if (!profile || !["admin", "operator"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    // Check if regulation is used by services
    const servicesCount = await prisma.service.count({
      where: { regulation_id: id },
    });

    if (servicesCount > 0) {
      return {
        success: false,
        error: `Regulasi tidak dapat dihapus karena masih digunakan oleh ${servicesCount} layanan`,
      };
    }

    await prisma.regulation.delete({
      where: { id },
    });

    revalidatePath("/admin/regulations");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting regulation:", error);
    return {
      success: false,
      error: error.message || "Gagal menghapus regulasi",
    };
  }
}

/**
 * Get semua regulasi untuk dropdown (tanpa pagination)
 */
export async function getAllRegulationsForDropdown() {
  try {
    const regulations = await prisma.regulation.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    });

    return { regulations, success: true };
  } catch (error: any) {
    console.error("Error getting regulations for dropdown:", error);
    return {
      regulations: [],
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get regulasi dengan parameters by ID untuk dropdown
 */
export async function getRegulationWithParameters(id: string) {
  try {
    const regulation = await prisma.regulation.findUnique({
      where: { id },
      include: {
        parameters: {
          orderBy: { sequence: "asc" },
          select: {
            id: true,
            parameter_name: true,
            method: true,
            unit: true,
            limit_min: true,
            limit_max: true,
            limit_value: true,
            requirements: true,
            is_mandatory: true,
          },
        },
      },
    });

    if (!regulation) {
      throw new Error("Regulation not found");
    }

    return { regulation, success: true };
  } catch (error: any) {
    console.error("Error getting regulation with parameters:", error);
    return {
      regulation: null,
      success: false,
      error: error.message,
    };
  }
}
