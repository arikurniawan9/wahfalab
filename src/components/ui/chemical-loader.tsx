import React from "react";
import { cn } from "@/lib/utils";

export interface ChemicalLoaderProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function ChemicalLoader({ 
  className = "", 
  size = "sm",
  fullScreen = false
}: ChemicalLoaderProps) {
  const sizeClasses = {
    xs: "h-2 w-2",
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  const containerSizeClasses = {
    xs: "h-10",
    sm: "h-12",
    md: "h-16",
    lg: "h-20",
  };

  const content = (
    <div className={cn(`flex items-end space-x-5 ${containerSizeClasses[size]}`, className)}>
      <div className="animate-bounce [animation-delay:-0.3s]">
        <div className={`relative flex ${sizeClasses[size]}`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
          <span className={`relative inline-flex rounded-full ${sizeClasses[size]} bg-lime-500 shadow-[0_0_15px_rgba(163,230,53,0.5)]`}></span>
        </div>
      </div>

      <div className="animate-bounce [animation-delay:-0.2s]">
        <div className={`relative flex ${sizeClasses[size]}`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 [animation-delay:200ms]"></span>
          <span className={`relative inline-flex rounded-full ${sizeClasses[size]} bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]`}></span>
        </div>
      </div>

      <div className="animate-bounce [animation-delay:-0.1s]">
        <div className={`relative flex ${sizeClasses[size]}`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 [animation-delay:400ms]"></span>
          <span className={`relative inline-flex rounded-full ${sizeClasses[size]} bg-teal-600 shadow-[0_0_15px_rgba(13,148,136,0.5)]`}></span>
        </div>
      </div>

      <div className="animate-bounce">
        <div className={`relative flex ${sizeClasses[size]}`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75 [animation-delay:600ms]"></span>
          <span className={`relative inline-flex rounded-full ${sizeClasses[size]} bg-emerald-900 shadow-[0_0_15px_rgba(6,78,59,0.5)]`}></span>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
        {content}
        <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-emerald-900 animate-pulse">
          Memuat Sistem...
        </p>
      </div>
    );
  }

  return content;
}
