"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FileText, Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Tidak ada data",
  description = "Mulai dengan menambahkan data pertama Anda",
  icon,
  action,
  className,
}: EmptyStateProps) {
  const defaultIcon = (
    <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
      <Inbox className="h-8 w-8 text-emerald-300" />
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon || defaultIcon}
      <h3 className="mt-4 text-lg font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
