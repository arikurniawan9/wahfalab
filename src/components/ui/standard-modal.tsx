"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StandardModalProps {
  /**
   * Control visibility of modal
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  /**
   * Modal title (required)
   */
  title: React.ReactNode;
  
  /**
   * Modal description (optional)
   */
  description?: React.ReactNode;
  
  /**
   * Icon to display in header (optional)
   */
  icon?: React.ReactNode;
  
  /**
   * Modal variant - controls layout and styling
   * - form: For create/edit forms
   * - detail: For viewing details
   * - confirm: For confirmation dialogs
   * - wide: Wider modal for complex content
   */
  variant?: "form" | "detail" | "confirm" | "wide" | "default";
  
  /**
   * Custom content to render
   */
  children?: React.ReactNode;
  
  /**
   * Footer actions (buttons)
   */
  actions?: React.ReactNode;
  
  /**
   * Show close button in header
   */
  showCloseButton?: boolean;
  
  /**
   * Disable close on outside click
   */
  disableOutsideClick?: boolean;
  
  /**
   * Custom className for content
   */
  contentClassName?: string;
  
  /**
   * Custom className for header
   */
  headerClassName?: string;
  
  /**
   * Custom className for body
   */
  bodyClassName?: string;
  
  /**
   * Custom className for footer
   */
  footerClassName?: string;
}

export function StandardModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  variant = "default",
  children,
  actions,
  showCloseButton = true,
  disableOutsideClick = false,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
}: StandardModalProps) {
  // Determine modal size based on variant
  const sizeClasses = {
    default: "max-w-lg",
    form: "max-w-2xl",
    detail: "max-w-3xl",
    wide: "max-w-5xl",
    confirm: "max-w-md",
  };

  // Header gradient based on variant
  const headerVariants = {
    default: "bg-gradient-to-r from-slate-900 to-slate-800",
    form: "bg-gradient-to-r from-emerald-900 to-emerald-800",
    detail: "bg-gradient-to-r from-blue-900 to-blue-800",
    wide: "bg-gradient-to-r from-slate-900 to-slate-800",
    confirm: "bg-gradient-to-r from-amber-900 to-amber-800",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[95vw] sm:max-w-none rounded-[2rem] border-none p-0 overflow-hidden shadow-2xl bg-white",
          sizeClasses[variant],
          contentClassName
        )}
        showCloseButton={false}
        onInteractOutside={(e) => {
          if (disableOutsideClick) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <div className={cn(
          "p-6 md:p-8 text-white flex items-center justify-between",
          headerVariants[variant],
          headerClassName
        )}>
          <div className="flex items-center gap-4">
            {icon && (
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg">
                {icon}
              </div>
            )}
            <div className="space-y-1">
              <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-none">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white/30 hover:text-white hover:bg-white/10 rounded-lg h-10 w-10 transition-all active:scale-90 shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Body */}
        <div className={cn(
          "p-6 md:p-8 bg-white",
          variant === "detail" ? "bg-slate-50/30" : "",
          bodyClassName
        )}>
          {children}
        </div>

        {/* Footer */}
        {actions && (
          <DialogFooter className={cn(
            "p-6 md:p-8 pt-0 bg-white border-t border-slate-100 flex justify-end gap-3",
            footerClassName
          )}>
            {actions}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick Modal Presets for common use cases
 */

// Form Modal Preset
interface FormModalProps extends Omit<StandardModalProps, "variant"> {
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function FormModal({
  onSubmit,
  submitText = "Simpan",
  cancelText = "Batal",
  loading = false,
  children,
  actions,
  ...props
}: FormModalProps) {
  const defaultActions = (
    <>
      <Button
        variant="ghost"
        onClick={() => props.onOpenChange(false)}
        className="flex-1 md:flex-none h-11 rounded-xl font-black text-slate-400 uppercase text-[9px] tracking-widest hover:bg-slate-100 transition-all"
      >
        {cancelText}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={loading}
        className="flex-[2] md:flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[9px] tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : submitText}
      </Button>
    </>
  );

  return (
    <StandardModal variant="form" actions={actions || defaultActions} {...props}>
      {children}
    </StandardModal>
  );
}

// Detail Modal Preset
interface DetailModalProps extends Omit<StandardModalProps, "variant"> {
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "destructive" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function DetailModal({
  primaryAction,
  secondaryAction,
  children,
  actions,
  ...props
}: DetailModalProps) {
  const defaultActions = (
    <>
      {secondaryAction && (
        <Button
          variant="outline"
          onClick={secondaryAction.onClick}
          className="h-11 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest"
        >
          {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
          {secondaryAction.label}
        </Button>
      )}
      {primaryAction && (
        <Button
          variant={primaryAction.variant || "default"}
          onClick={primaryAction.onClick}
          className={cn(
            "h-11 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg",
            primaryAction.variant === "destructive" 
              ? "bg-rose-600 hover:bg-rose-700 text-white" 
              : "bg-slate-900 hover:bg-slate-800 text-white"
          )}
        >
          {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
          {primaryAction.label}
        </Button>
      )}
    </>
  );

  return (
    <StandardModal variant="detail" actions={actions || defaultActions} {...props}>
      {children}
    </StandardModal>
  );
}

// Confirm Modal Preset
interface ConfirmModalProps extends Omit<StandardModalProps, "variant" | "description"> {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  loading?: boolean;
  message: React.ReactNode;
}

export function ConfirmModal({
  onConfirm,
  confirmText = "Hapus",
  cancelText = "Batal",
  confirmVariant = "destructive",
  loading = false,
  message,
  actions,
  ...props
}: ConfirmModalProps) {
  const defaultActions = (
    <>
      <Button
        variant="outline"
        onClick={() => props.onOpenChange(false)}
        disabled={loading}
        className="flex-1 h-11 rounded-xl font-black uppercase text-[9px] tracking-widest"
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        disabled={loading}
        className={cn(
          "flex-[2] h-11 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg",
          confirmVariant === "destructive"
            ? "bg-rose-600 hover:bg-rose-700 text-white"
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
        )}
      >
        {loading ? "Memproses..." : confirmText}
      </Button>
    </>
  );

  return (
    <StandardModal variant="confirm" actions={actions || defaultActions} {...props}>
      <div className="flex flex-col items-center text-center py-4">
        {message}
      </div>
    </StandardModal>
  );
}
