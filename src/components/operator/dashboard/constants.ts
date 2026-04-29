import {
  CheckCircle2,
  Clock,
  FileText,
  TestTube,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ADMIN_STATUS_LABELS, ADMIN_WORKFLOW_LABELS } from "@/lib/constants/workflow-copy";

export type OperatorStatusConfig = {
  label: string;
  color: string;
  theme: string;
  icon: LucideIcon;
  progress: number;
};

export const statusConfig: Record<string, OperatorStatusConfig> = {
  scheduled: {
    label: ADMIN_STATUS_LABELS.scheduled,
    color: "text-blue-600",
    theme: "bg-blue-50 border-blue-100",
    icon: Clock,
    progress: 20,
  },
  sampling: {
    label: ADMIN_STATUS_LABELS.sampling,
    color: "text-amber-600",
    theme: "bg-amber-50 border-amber-100",
    icon: Truck,
    progress: 40,
  },
  analysis: {
    label: ADMIN_STATUS_LABELS.analysis,
    color: "text-purple-600",
    theme: "bg-purple-50 border-purple-100",
    icon: TestTube,
    progress: 60,
  },
  reporting: {
    label: ADMIN_STATUS_LABELS.reporting,
    color: "text-indigo-600",
    theme: "bg-indigo-50 border-indigo-100",
    icon: FileText,
    progress: 80,
  },
  completed: {
    label: ADMIN_STATUS_LABELS.completed,
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
  { key: "scheduled", label: ADMIN_WORKFLOW_LABELS.scheduled, icon: Clock },
  { key: "sampling", label: ADMIN_WORKFLOW_LABELS.sampling, icon: Truck },
  { key: "analysis", label: ADMIN_WORKFLOW_LABELS.analysis, icon: TestTube },
  { key: "reporting", label: ADMIN_WORKFLOW_LABELS.reporting, icon: FileText },
  { key: "completed", label: ADMIN_WORKFLOW_LABELS.completed, icon: CheckCircle2 },
];
