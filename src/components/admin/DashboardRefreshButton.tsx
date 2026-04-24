"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function DashboardRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
      disabled={isPending}
      aria-label="Refresh dashboard"
      title="Refresh dashboard"
    >
      <RefreshCw
        className={`h-5 w-5 text-slate-600 group-hover:text-emerald-600 transition-colors ${isPending ? "animate-spin" : ""}`}
      />
    </button>
  );
}
