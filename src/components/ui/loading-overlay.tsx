import React from "react";
import { ChemicalLoader } from "./chemical-loader";

export interface LoadingOverlayProps {
  className?: string;
  show?: boolean;
}

export function LoadingOverlay({ className = "", show = true }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center ${className}`}>
      <ChemicalLoader size="lg" />
    </div>
  );
}
