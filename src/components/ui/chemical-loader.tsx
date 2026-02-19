import React from "react";

export interface ChemicalLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ChemicalLoader({ className = "", size = "md" }: ChemicalLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const containerSizeClasses = {
    sm: "h-16",
    md: "h-24",
    lg: "h-32",
  };

  return (
    <div className={`flex items-end space-x-5 ${containerSizeClasses[size]} ${className}`}>
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
}
