"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChemicalLoader } from "./chemical-loader";
import { X } from "lucide-react";
import { Button } from "./button";

interface LoadingOverlayProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  showClose?: boolean;
  onClose?: () => void;
  progress?: number; // 0-100 for progress bar
  variant?: "default" | "fullscreen" | "modal" | "inline";
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isOpen,
  title = "Memproses...",
  description,
  showClose = false,
  onClose,
  progress,
  variant = "default",
  children,
}: LoadingOverlayProps) {
  if (!isOpen) return null;

  const variants = {
    default: "fixed inset-0 z-[9999]",
    fullscreen: "fixed inset-0 z-[9999]",
    modal: "fixed inset-0 z-[9999]",
    inline: "absolute inset-0 z-50",
  };

  const backgrounds = {
    default: "bg-slate-900/70 backdrop-blur-md",
    fullscreen: "bg-slate-950/95",
    modal: "bg-white/80 backdrop-blur-md",
    inline: "bg-white/80 backdrop-blur-sm",
  };

  return (
    <div className={cn(variants[variant], backgrounds[variant], "flex items-center justify-center")}>
      <div className="flex flex-col items-center gap-3 p-6 max-w-sm w-full mx-4">
        {/* Loader */}
        {children || <ChemicalLoader size="sm" />}

        {/* Title & Description */}
        {(title || description) && (
          <div className="text-center space-y-1">
            {title && (
              <h3 className={cn(
                "font-semibold text-lg",
                variant === "modal" ? "text-slate-900" : "text-white"
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn(
                "text-sm",
                variant === "modal" ? "text-slate-600" : "text-slate-200"
              )}>
                {description}
              </p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-full space-y-2">
            <div className={cn(
              "h-2 rounded-full overflow-hidden",
              variant === "modal" ? "bg-slate-200" : "bg-slate-700"
            )}>
              <div
                className="h-full bg-emerald-600 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className={cn(
              "text-xs text-center",
              variant === "modal" ? "text-slate-500" : "text-slate-400"
            )}>
              {progress}% completed
            </p>
          </div>
        )}

        {/* Close Button */}
        {showClose && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn(
              "absolute top-2 right-2",
              variant === "modal" ? "text-slate-400 hover:text-slate-600" : "text-white/70 hover:text-white"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
