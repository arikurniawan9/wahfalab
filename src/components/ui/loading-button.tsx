"use client";

import React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  spinnerPosition?: "left" | "right";
  variant?: "default" | "outline" | "ghost" | "destructive";
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      spinnerPosition = "left",
      disabled,
      variant,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        disabled={loading || disabled}
        className={cn("relative min-w-[120px]", className)}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            {spinnerPosition === "left" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>{loadingText || children}</span>
            {spinnerPosition === "right" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";
