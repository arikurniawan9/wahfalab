import { CheckCircle2, Clock, FileText, TestTube, Truck } from "lucide-react";
import { StatFilterCard } from "./StatFilterCard";

type DashboardStats = {
  scheduled: number;
  sampling: number;
  analysis: number;
  reporting: number;
  completed: number;
};

type OperatorStatsFiltersProps = {
  stats: DashboardStats;
  filterStatus: string;
  onFilterChange: (status: string) => void;
};

export function OperatorStatsFilters({
  stats,
  filterStatus,
  onFilterChange,
}: OperatorStatsFiltersProps) {
  const handleFilterSelect = (status: string) => {
    onFilterChange(filterStatus === status ? "all" : status);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatFilterCard
        title="Antrean"
        value={stats.scheduled}
        icon={Clock}
        color="blue"
        onClick={() => handleFilterSelect("scheduled")}
        active={filterStatus === "scheduled"}
      />
      <StatFilterCard
        title="Sampling"
        value={stats.sampling}
        icon={Truck}
        color="amber"
        onClick={() => handleFilterSelect("sampling")}
        active={filterStatus === "sampling"}
      />
      <StatFilterCard
        title="Analisis"
        value={stats.analysis}
        icon={TestTube}
        color="purple"
        onClick={() => handleFilterSelect("analysis")}
        active={filterStatus === "analysis"}
      />
      <StatFilterCard
        title="Pelaporan"
        value={stats.reporting}
        icon={FileText}
        color="indigo"
        onClick={() => handleFilterSelect("reporting")}
        active={filterStatus === "reporting"}
      />
      <StatFilterCard
        title="Selesai"
        value={stats.completed}
        icon={CheckCircle2}
        color="emerald"
        onClick={() => handleFilterSelect("completed")}
        active={filterStatus === "completed"}
      />
    </div>
  );
}
