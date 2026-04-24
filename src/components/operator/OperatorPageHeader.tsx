import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperatorPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  statsLabel?: string;
  statsValue?: string | number;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: ReactNode;
  className?: string;
};

export function OperatorPageHeader({
  icon: Icon,
  title,
  description,
  statsLabel,
  statsValue,
  onRefresh,
  refreshing = false,
  actions,
  className,
}: OperatorPageHeaderProps) {
  return (
    <div className={cn("mb-8 overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50", className)}>
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Icon className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none uppercase">
                {title}
              </h1>
              <p className="text-emerald-100/70 text-[10px] md:text-xs font-medium mt-1 uppercase tracking-widest">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {typeof statsValue !== "undefined" && statsLabel && (
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">
                  {statsLabel}
                </p>
                <p className="text-lg font-black text-white leading-none">
                  {statsValue}
                </p>
              </div>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl h-9 px-4 backdrop-blur-md transition-all text-xs font-bold"
                onClick={onRefresh}
              >
                <RotateCcw className={cn("h-3.5 w-3.5 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
