"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getProfile } from "./auth";
import type { Prisma } from "@/generated/prisma";

/**
 * Server Actions untuk Regulasi
 * CRUD operations untuk Regulation dan RegulationParameter
 */

// Types
export interface RegulationParameterInput {
  parameter: string;
  unit?: string;
  standard_value?: string;
  method?: string;
  sequence?: number;
}

export interface RegulationInput {
  name: string;
  description?: string;
  status?: string;
  parameter_tags?: string[];
}

/**
 * Get semua regulasi
 */
export async function getRegulations(
  page = 1, 
  limit = 20, 
  search = "", 
  status = "all",
  sortBy = "created_at",
  sortOrder = "desc"
) {
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
        { name: { contains: search, mode: "insensitive" as const } },
        { 
          parameters: { 
            some: { 
              parameter: { contains: search, mode: "insensitive" as const } 
            } 
          } 
        },
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
        orderBy: { [sortBy]: sortOrder as any },
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
      const regulation = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updated = await tx.regulation.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description || null,
            status: data.status || "active",
            updated_at: new Date(),
          },
        });

        if (data.parameter_tags) {
          // Sync parameters: delete and recreate
          await tx.regulationParameter.deleteMany({
            where: { regulation_id: id }
          });

          await tx.regulationParameter.createMany({
            data: data.parameter_tags.map((p, idx) => ({
              regulation_id: id,
              parameter: p,
              sequence: idx
            }))
          });
        }

        return updated;
      });

      revalidatePath("/admin/regulations");
      return { success: true, regulation };
    } else {
      // Create new
      const regulation = await prisma.regulation.create({
        data: {
          name: data.name,
          description: data.description || null,
          status: data.status || "active",
          parameters: {
            create: (data.parameter_tags || []).map((p, idx) => ({
              parameter: p,
              sequence: idx
            }))
          }
        },
      });

      revalidatePath("/admin/regulations");
      return { success: true, regulation };
    }
  } catch (error: any) {
    console.error("Error creating/updating regulation:", error);

    // Robust error handling for Unique Constraint (Duplicate Name)
    // Checks both instanceof and common error properties for compatibility
    if (error.code === 'P2002' || (error?.message && error.message.includes('Unique constraint failed'))) {
      return {
        success: false,
        error: "Nama regulasi sudah terdaftar. Silakan gunakan nama lain agar data tetap unik.",
      };
    }

    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat menyimpan regulasi",
    };
  }
}

/**
 * Create atau update parameter regulasi secara mendetail
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
      const parameter = await prisma.regulationParameter.update({
        where: { id: parameterId },
        data: {
          parameter: data.parameter,
          method: data.method,
          unit: data.unit,
          standard_value: data.standard_value,
          sequence: data.sequence || 0,
        },
      });
      revalidatePath("/admin/regulations");
      return { success: true, parameter };
    } else {
      const parameter = await prisma.regulationParameter.create({
        data: {
          regulation_id: regulationId,
          parameter: data.parameter,
          method: data.method,
          unit: data.unit,
          standard_value: data.standard_value,
          sequence: data.sequence || 0,
        },
      });
      revalidatePath("/admin/regulations");
      return { success: true, parameter };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan parameter" };
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
 * Import regulations from JSON data (parsed from CSV)
 */
export async function importRegulations(items: any[]) {
  try {
    const profile = await getProfile();
    if (!profile || !["admin", "operator"].includes(profile.role)) {
      throw new Error("Unauthorized");
    }

    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const name = item.name || item.Name;
        if (!name) continue;

        const description = item.description || item.Description || "";
        const status = (item.status || item.Status || "active").toLowerCase();
        
        // Extract parameters from string (comma separated)
        const paramStr = item.parameters || item.Parameters || "";
        const parameter_tags = paramStr ? paramStr.split(',').map((p: string) => p.trim()).filter((p: string) => p !== "") : [];

        await createOrUpdateRegulation({
          name,
          description,
          status,
          parameter_tags
        });
        
        successCount++;
      } catch (err) {
        console.error("Error importing item:", err);
        errorCount++;
      }
    }

    revalidatePath("/admin/regulations");
    return { success: true, successCount, errorCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get semua regulasi untuk dropdown
 */
export async function getAllRegulationsForDropdown() {
  try {
    const regulations = await prisma.regulation.findMany({
      where: { status: "active" },
      include: {
        parameters: {
          select: { parameter: true },
          orderBy: { sequence: "asc" }
        }
      },
      orderBy: { name: "asc" },
    });

    // Transform to include simple parameters_list for easier frontend consumption
    const transformed = regulations.map((reg: { parameters: Array<{ parameter: string }>; [key: string]: any }) => ({
      ...reg,
      parameters_list: reg.parameters.map((p: { parameter: string }) => p.parameter)
    }));

    return { regulations: transformed, success: true };
  } catch (error: any) {
    return { regulations: [], success: false, error: error.message };
  }
}
