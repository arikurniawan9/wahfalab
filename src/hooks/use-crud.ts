"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface UseCrudOptions<T, CreateInput, UpdateInput> {
  // Data fetching
  fetchFn: (page?: number, limit?: number, search?: string) => Promise<{
    items: T[];
    total: number;
    pages: number;
  }>;

  // CRUD operations
  createFn?: (data: CreateInput) => Promise<T>;
  updateFn?: (id: string, data: UpdateInput) => Promise<T>;
  deleteFn?: (id: string) => Promise<void>;
  deleteManyFn?: (ids: string[]) => Promise<void>;

  // Messages
  messages?: {
    loading?: string;
    createSuccess?: string;
    createError?: string;
    updateSuccess?: string;
    updateError?: string;
    deleteSuccess?: string;
    deleteError?: string;
    deleteManySuccess?: string;
    deleteManyError?: string;
  };

  // Options
  initialPage?: number;
  initialLimit?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseCrudReturn<T, CreateInput, UpdateInput> {
  // Data state
  data: T[];
  total: number;
  pages: number;
  loading: boolean;
  error: Error | null;

  // Pagination
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Search
  search: string;
  setSearch: (search: string) => void;

  // CRUD operations
  create: (data: CreateInput) => Promise<T | null>;
  update: (id: string, data: UpdateInput) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
  deleteMany: (ids: string[]) => Promise<boolean>;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (allIds: string[]) => void;
  clearSelection: () => void;

  // Refresh
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useCrud<T extends { id?: string }, CreateInput = Partial<T>, UpdateInput = Partial<T>>({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  deleteManyFn,
  messages = {},
  initialPage = 1,
  initialLimit = 10,
  onSuccess,
  onError,
}: UseCrudOptions<T, CreateInput, UpdateInput>): UseCrudReturn<T, CreateInput, UpdateInput> {
  // Data state
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // Search
  const [search, setSearch] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, limit, search);
      setData(result.items || []);
      setTotal(result.total || 0);
      setPages(result.pages || 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch data");
      setError(error);
      toast.error(messages.loading || "Gagal memuat data", {
        description: error.message,
      });
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, limit, search, messages.loading, onError]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchData]);

  // Create
  const create = useCallback(
    async (inputData: CreateInput) => {
      if (!createFn) {
        toast.error("Create function not available");
        return null;
      }

      try {
        const result = await createFn(inputData);
        toast.success(
          messages.createSuccess || "Data berhasil ditambahkan",
          {
            description: `${messages.createSuccess || "Data baru"}`,
          }
        );
        await fetchData();
        onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to create");
        toast.error(messages.createError || "Gagal menambahkan data", {
          description: error.message,
        });
        onError?.(error);
        return null;
      }
    },
    [createFn, messages.createSuccess, messages.createError, fetchData, onSuccess, onError]
  );

  // Update
  const update = useCallback(
    async (id: string, inputData: UpdateInput) => {
      if (!updateFn) {
        toast.error("Update function not available");
        return null;
      }

      try {
        const result = await updateFn(id, inputData);
        toast.success(messages.updateSuccess || "Data berhasil diperbarui");
        await fetchData();
        onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to update");
        toast.error(messages.updateError || "Gagal memperbarui data", {
          description: error.message,
        });
        onError?.(error);
        return null;
      }
    },
    [updateFn, messages.updateSuccess, messages.updateError, fetchData, onSuccess, onError]
  );

  // Delete
  const deleteItem = useCallback(
    async (id: string) => {
      if (!deleteFn) {
        toast.error("Delete function not available");
        return false;
      }

      try {
        await deleteFn(id);
        toast.success(messages.deleteSuccess || "Data berhasil dihapus");
        await fetchData();
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        onSuccess?.();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to delete");
        toast.error(messages.deleteError || "Gagal menghapus data", {
          description: error.message,
        });
        onError?.(error);
        return false;
      }
    },
    [deleteFn, messages.deleteSuccess, messages.deleteError, fetchData, onSuccess, onError]
  );

  // Delete many
  const deleteMany = useCallback(
    async (ids: string[]) => {
      if (!deleteManyFn) {
        toast.error("Bulk delete function not available");
        return false;
      }

      try {
        await deleteManyFn(ids);
        toast.success(
          messages.deleteManySuccess || `${ids.length} data berhasil dihapus`
        );
        await fetchData();
        setSelectedIds([]);
        onSuccess?.();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to delete");
        toast.error(messages.deleteManyError || "Gagal menghapus data", {
          description: error.message,
        });
        onError?.(error);
        return false;
      }
    },
    [
      deleteManyFn,
      messages.deleteManySuccess,
      messages.deleteManyError,
      fetchData,
      onSuccess,
      onError,
    ]
  );

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(
    (allIds: string[]) => {
      if (selectedIds.length === allIds.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(allIds);
      }
    },
    [selectedIds.length]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    total,
    pages,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    search,
    setSearch,
    create,
    update,
    delete: deleteItem,
    deleteMany,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    refresh,
    clearError,
  };
}
