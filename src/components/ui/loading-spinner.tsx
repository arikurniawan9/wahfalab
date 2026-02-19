import React from "react";
import { ChemicalLoader, type ChemicalLoaderProps } from "./chemical-loader";

export interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullscreen?: boolean;
  center?: boolean;
}

export function LoadingSpinner({ 
  className = "", 
  size = "md",
  fullscreen = false,
  center = false,
}: LoadingSpinnerProps) {
  if (fullscreen) {
    return (
      <div className={`fixed inset-0 bg-slate-950 flex items-center justify-center z-[9999] ${className}`}>
        <ChemicalLoader size={size} />
      </div>
    );
  }

  if (center) {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        <ChemicalLoader size={size} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ChemicalLoader size={size} />
    </div>
  );
}
