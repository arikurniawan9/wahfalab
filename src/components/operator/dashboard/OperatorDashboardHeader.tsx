import { AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperatorDashboardHeaderProps = {
  operatorName: string;
  stuckCount: number;
  refreshing: boolean;
  onRefresh: () => void;
};

function getGreetingByHour() {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export function OperatorDashboardHeader({
  operatorName,
  stuckCount,
  refreshing,
  onRefresh,
}: OperatorDashboardHeaderProps) {
  const greeting = getGreetingByHour();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 bg-emerald-600 rounded-full" />
          <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">
            Operasional Center
          </h1>
        </div>
        <p className="text-slate-500 text-sm font-medium italic pl-4">
          {greeting},{" "}
          <span className="text-emerald-700 font-bold not-italic">{operatorName}</span>. Pantau antrean hari ini.
        </p>
      </div>
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        {stuckCount > 0 && (
          <Badge className="bg-rose-500 text-white font-black text-[10px] animate-pulse h-10 px-4 rounded-xl border-none">
            <AlertCircle className="h-3 w-3 mr-2" />
            {stuckCount} PEKERJAAN TERHAMBAT
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-10 w-10 rounded-xl hover:bg-emerald-50 text-emerald-600"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
        <div className="h-10 px-4 flex items-center gap-3 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Status Anda</p>
            <p className="text-[11px] font-bold text-emerald-600 uppercase">Aktif (Operator)</p>
          </div>
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/20">
            {operatorName.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
