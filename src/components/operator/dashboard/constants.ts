import {
  CheckCircle2,
  Clock,
  FileText,
  TestTube,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type OperatorStatusConfig = {
  label: string;
  color: string;
  theme: string;
  icon: LucideIcon;
  progress: number;
};

export const statusConfig: Record<string, OperatorStatusConfig> = {
  scheduled: {
    label: "Terjadwal",
    color: "text-blue-600",
    theme: "bg-blue-50 border-blue-100",
    icon: Clock,
    progress: 20,
  },
  sampling: {
    label: "Sampling",
    color: "text-amber-600",
    theme: "bg-amber-50 border-amber-100",
    icon: Truck,
    progress: 40,
  },
  analysis: {
    label: "Analisis Lab",
    color: "text-purple-600",
    theme: "bg-purple-50 border-purple-100",
    icon: TestTube,
    progress: 60,
  },
  reporting: {
    label: "Pelaporan",
    color: "text-indigo-600",
    theme: "bg-indigo-50 border-indigo-100",
    icon: FileText,
    progress: 80,
  },
  completed: {
    label: "Selesai",
    color: "text-emerald-600",
    theme: "bg-emerald-50 border-emerald-100",
    icon: CheckCircle2,
    progress: 100,
  },
};

export const progressSteps: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "scheduled", label: "Terjadwal", icon: Clock },
  { key: "sampling", label: "Sampling", icon: Truck },
  { key: "analysis", label: "Analisis Lab", icon: TestTube },
  { key: "reporting", label: "Pelaporan", icon: FileText },
  { key: "completed", label: "Selesai", icon: CheckCircle2 },
];
