"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getId?: (item: T) => string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  getId,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSelectAll = () => {
    if (!onSelectionChange || !getId) return;

    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => getId(item)).filter(Boolean) as string[]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <div className="animate-pulse p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("border rounded-lg", className)}>
        {emptyState || (
          <div className="p-8 text-center text-slate-500">
            Tidak ada data
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            {selectable && onSelectionChange && (
              <TableHead className="w-12 px-6">
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === data.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("font-bold text-emerald-900 px-4 cursor-pointer hover:bg-slate-100", column.className)}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {sortConfig?.key === column.key && (
                    <span className="text-xs">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => {
            const rowId = getId ? getId(item) : (item.id as string);
            const isSelected = selectedIds.includes(rowId);

            return (
              <TableRow
                key={rowId}
                className={cn(
                  "hover:bg-emerald-50/10 transition-colors",
                  onRowClick && "cursor-pointer",
                  isSelected && "bg-emerald-50/50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {selectable && onSelectionChange && (
                  <TableCell className="px-6">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked && rowId) {
                          handleSelectRow(rowId);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key} className={cn("px-4", column.className)}>
                    {column.cell ? column.cell(item) : (item[column.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
