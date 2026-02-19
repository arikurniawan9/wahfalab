"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-emerald-100 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-4",
          description: "group-[.toast]:text-slate-500 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-emerald-600 group-[.toast]:text-white group-[.toast]:hover:bg-emerald-700 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-200 group-[.toast]:text-slate-700 group-[.toast]:hover:bg-slate-300 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:font-medium",
          icon: "group-[.toast]:text-emerald-600",
          success:
            "group-[.toast]:bg-emerald-50 group-[.toast]:border-emerald-200 group-[.toast]:text-emerald-900",
          error:
            "group-[.toast]:bg-red-50 group-[.toast]:border-red-200 group-[.toast]:text-red-900",
          warning:
            "group-[.toast]:bg-amber-50 group-[.toast]:border-amber-200 group-[.toast]:text-amber-900",
          info:
            "group-[.toast]:bg-blue-50 group-[.toast]:border-blue-200 group-[.toast]:text-blue-900",
          loading:
            "group-[.toast]:bg-slate-50 group-[.toast]:border-slate-200 group-[.toast]:text-slate-900",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="h-5 w-5 text-emerald-600" />,
        info: <InfoIcon className="h-5 w-5 text-blue-600" />,
        warning: <TriangleAlertIcon className="h-5 w-5 text-amber-600" />,
        error: <OctagonXIcon className="h-5 w-5 text-red-600" />,
        loading: <Loader2Icon className="h-5 w-5 text-slate-600 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      position="top-center"
      richColors
      closeButton
      {...props}
    />
  )
}

export { Toaster }
