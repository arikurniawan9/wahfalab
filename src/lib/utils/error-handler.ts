import { toast } from "sonner";

/**
 * Standardized error handler for consistent error messages across the app
 */
export function handleError(
  error: unknown,
  options?: {
    title?: string;
    description?: string;
    action?: "create" | "update" | "delete" | "fetch";
    silent?: boolean;
  }
) {
  const {
    title,
    description,
    action = "fetch",
    silent = false,
  } = options || {};

  const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";

  const defaultTitles = {
    create: "Gagal menambahkan data",
    update: "Gagal memperbarui data",
    delete: "Gagal menghapus data",
    fetch: "Gagal memuat data",
  };

  if (!silent) {
    toast.error(title || defaultTitles[action], {
      description: description || errorMessage,
      duration: 5000,
    });
  }

  // Log error for debugging
  console.error(`[Error - ${action}]:`, error);

  return error instanceof Error ? error : new Error(errorMessage);
}

/**
 * Standardized success handler for consistent success messages
 */
export function handleSuccess(
  message: string,
  options?: {
    description?: string;
    duration?: number;
    action?: "create" | "update" | "delete";
  }
) {
  const {
    description,
    duration = 3000,
    action,
  } = options || {};

  const defaultDescriptions = {
    create: "Data berhasil ditambahkan",
    update: "Data berhasil diperbarui",
    delete: "Data berhasil dihapus",
  };

  toast.success(message, {
    description: description || defaultDescriptions[action as keyof typeof defaultDescriptions],
    duration,
  });
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  fields: Record<string, unknown>,
  fieldNames: Record<string, string>
): string | null {
  for (const [key, displayName] of Object.entries(fieldNames)) {
    const value = fields[key];

    if (value === undefined || value === null || value === "") {
      return `${displayName} wajib diisi`;
    }

    if (typeof value === "string" && value.trim() === "") {
      return `${displayName} wajib diisi`;
    }
  }

  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) return null; // Let required validation handle empty

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return "Format email tidak valid";
  }

  return null;
}

/**
 * Validate phone number (Indonesian format)
 */
export function validatePhone(phone: string): string | null {
  if (!phone) return null;

  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

  if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
    return "Nomor telepon tidak valid";
  }

  return null;
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number | string,
  min?: number,
  max?: number,
  fieldName = "Nilai"
): string | null {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return `${fieldName} harus berupa angka`;
  }

  if (min !== undefined && numValue < min) {
    return `${fieldName} minimal ${min}`;
  }

  if (max !== undefined && numValue > max) {
    return `${fieldName} maksimal ${max}`;
  }

  return null;
}

/**
 * Create async handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    title?: string;
    action?: "create" | "update" | "delete" | "fetch";
    onSuccess?: (result: Awaited<T>) => void;
    onError?: (error: Error) => void;
    silent?: boolean;
  }
) {
  return async (...args: Parameters<T>): Promise<Awaited<T> | null> => {
    try {
      const result = await fn(...args);

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const handledError = handleError(error, {
        title: options?.title,
        action: options?.action,
        silent: options?.silent,
      });

      if (options?.onError) {
        options.onError(handledError);
      }

      return null;
    }
  };
}
