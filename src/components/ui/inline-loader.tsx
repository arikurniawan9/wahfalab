"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface InlineLoaderProps {
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  text?: string;
  showText?: boolean;
  className?: string;
}

export function InlineLoader({
  isLoading = true,
  size = "sm",
  text = "Loading",
  showText = false,
  className,
}: InlineLoaderProps) {
  if (!isLoading) return null;

  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-slate-500",
        className
      )}
    >
      <Loader2 className={cn("animate-spin", sizes[size])} />
      {showText && (
        <span className="text-xs">{text}</span>
      )}
    </div>
  );
}
