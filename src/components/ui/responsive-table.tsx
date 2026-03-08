"use client";

import React, { useState, useMemo } from "react";
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
import { TableSkeleton } from "./skeleton";
import { EmptyState } from "./empty-state";

/**
 * Column definition for ResponsiveTable
 */
export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  header: string;
  /** Custom class name for header */
  headerClassName?: string;
  /** Custom class name for cells */
  cellClassName?: string;
  /** Custom cell renderer */
  cell?: (item: T, index: number) => React.ReactNode;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Show in mobile card view */
  showInMobile?: boolean;
  /** Priority for mobile display (higher = more important) */
  mobilePriority?: number;
}

/**
 * Props for ResponsiveTable
 */
export interface ResponsiveTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data to display */
  data: T[];
  /** Loading state */
  loading?: boolean;
  /** Empty state component or props */
  emptyState?: React.ReactNode | { title?: string; description?: string; action?: React.ReactNode };
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row IDs */
  selectedIds?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (ids: string[]) => void;
  /** Function to get item ID */
  getId?: (item: T) => string;
  /** Enable row click handler */
  onRowClick?: (item: T) => void;
  /** Enable row hover effect */
  hoverable?: boolean;
  /** Custom class name */
  className?: string;
  /** Number of skeleton rows when loading */
  skeletonRows?: number;
  /** Enable mobile card view */
  mobileCardView?: boolean;
  /** Custom render for mobile card */
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  /** Card title field for mobile view */
  mobileTitleField?: string;
  /** Card subtitle field for mobile view */
  mobileSubtitleField?: string;
}

/**
 * ResponsiveTable Component
 * 
 * A feature-rich table component with:
 * - Automatic responsive design
 * - Mobile card view
 * - Sorting
 * - Row selection
 * - Loading states
 * - Empty states
 */
export function ResponsiveTable<T extends Record<string, unknown> | { id: string }>({
  columns,
  data,
  loading = false,
  emptyState,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  getId,
  onRowClick,
  hoverable = true,
  className,
  skeletonRows = 5,
  mobileCardView = true,
  renderMobileCard,
  mobileTitleField = "name",
  mobileSubtitleField,
}: ResponsiveTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Handle sorting
  const handleSort = (key: string) => {
    const sortableColumn = columns.find((col) => col.key === key);
    if (!sortableColumn?.sortable) return;

    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  // Get sorted data
  const sortedData = useMemo(() => {
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

  // Selection handlers
  const handleSelectAll = () => {
    if (!onSelectionChange || !getId) return;

    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(
        data.map((item) => getId(item)).filter(Boolean) as string[]
      );
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

  // Render empty state
  const renderEmptyState = () => {
    if (emptyState === null || emptyState === undefined) return null;
    
    if (React.isValidElement(emptyState)) {
      return emptyState;
    }

    if (typeof emptyState === 'object' && emptyState !== null) {
      const props = emptyState as { title?: string; description?: string; action?: React.ReactNode };
      return (
        <EmptyState
          title={props.title}
          description={props.description}
          action={props.action}
        />
      );
    }
    
    return null;
  };

  // Get sortable column class
  const getSortableClass = (column: Column<T>) => {
    if (!column.sortable) return "";
    return "cursor-pointer hover:bg-slate-100 transition-colors";
  };

  // Get sort indicator
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Render desktop table
  const renderDesktopTable = () => (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            {selectable && onSelectionChange && (
              <TableHead className="w-12 px-6">
                <Checkbox
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === data.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "font-bold text-emerald-900 px-4",
                  column.headerClassName,
                  getSortableClass(column)
                )}
                onClick={() => handleSort(column.key)}
              >
                {column.header}
                {getSortIndicator(column.key)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, index) => {
            const rowId = getId ? getId(item) : (item.id as string);
            const isSelected = selectedIds.includes(rowId);

            return (
              <TableRow
                key={rowId || index}
                className={cn(
                  "hover:bg-emerald-50/10 transition-colors",
                  hoverable && "cursor-pointer",
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
                  <TableCell
                    key={column.key}
                    className={cn("px-4", column.cellClassName)}
                  >
                    {column.cell
                      ? column.cell(item, index)
                      : (item[column.key as keyof typeof item] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Render mobile cards
  const renderMobileCards = () => (
    <div className="md:hidden divide-y divide-slate-100">
      {sortedData.map((item, index) => {
        const rowId = getId ? getId(item) : (item.id as string);
        const isSelected = selectedIds.includes(rowId);

        // Use custom render if provided
        if (renderMobileCard) {
          return (
            <div
              key={rowId || index}
              className={cn(
                "p-4 transition-colors",
                isSelected ? "bg-emerald-50/50" : "bg-white active:bg-slate-50"
              )}
              onClick={() => {
                if (selectable) {
                  handleSelectRow(rowId);
                }
                onRowClick?.(item);
              }}
            >
              {renderMobileCard(item, index)}
            </div>
          );
        }

        // Default card render
        const title = item[mobileTitleField as keyof T] as string;
        const subtitle = mobileSubtitleField
          ? (item[mobileSubtitleField as keyof T] as string)
          : null;

        // Get columns to show in mobile
        const mobileColumns = columns
          .filter((col) => col.showInMobile !== false)
          .sort(
            (a, b) => (b.mobilePriority || 0) - (a.mobilePriority || 0)
          );

        return (
          <div
            key={rowId || index}
            className={cn(
              "p-4 space-y-3 transition-colors",
              isSelected ? "bg-emerald-50/50" : "bg-white active:bg-slate-50"
            )}
            onClick={() => {
              if (selectable) {
                handleSelectRow(rowId);
              }
              onRowClick?.(item);
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3 flex-1">
                {selectable && onSelectionChange && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectRow(rowId)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{title}</h4>
                  {subtitle && (
                    <p className="text-[10px] text-slate-400 truncate mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional fields */}
            {mobileColumns.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {mobileColumns.map((column) => (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {column.header}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {column.cell
                        ? column.cell(item, index)
                        : (item[column.key as keyof typeof item] as React.ReactNode)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render loading state
  if (loading) {
    return (
      <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
        <TableSkeleton rows={skeletonRows} />
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden bg-white",
        className
      )}
    >
      {/* Desktop Table */}
      {renderDesktopTable()}

      {/* Mobile Cards */}
      {mobileCardView && renderMobileCards()}
    </div>
  );
}
