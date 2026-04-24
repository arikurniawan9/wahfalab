import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatFilterCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "amber" | "blue" | "purple" | "indigo" | "emerald";
  onClick: () => void;
  active?: boolean;
};

const colorClasses: Record<
  StatFilterCardProps["color"],
  { bg: string; text: string; ring: string }
> = {
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200" },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    ring: "ring-purple-200",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    ring: "ring-indigo-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "ring-emerald-200",
  },
};

export function StatFilterCard({
  title,
  value,
  icon: Icon,
  color,
  onClick,
  active = false,
}: StatFilterCardProps) {
  const style = colorClasses[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-[1.25rem] bg-white border-2 transition-all duration-300 cursor-pointer overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        active
          ? cn("border-emerald-600 shadow-xl shadow-emerald-900/10 scale-[1.02]", style.ring)
          : "border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 shadow-sm"
      )}
    >
      <div className="relative z-10 flex flex-col gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
            style.bg,
            style.text
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xl font-black text-slate-800 leading-none mb-1">{value}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      {active && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />}
    </button>
  );
}
