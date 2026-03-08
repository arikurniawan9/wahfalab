"use client";

import React from 'react';
import { 
  FileText, 
  Briefcase, 
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  FlaskConical,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'quotation' | 'job';
  title: string;
  subtitle: string;
  amount: number;
  formattedAmount?: string;
  timestamp: Date;
  formattedTime?: string;
  status: string;
  avatar?: string | null;
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  icon: React.ElementType;
  bgColor: string;
}> = {
  // Quotation statuses
  pending: { 
    label: 'Pending', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: Clock 
  },
  approved: { 
    label: 'Disetujui', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    icon: CheckCircle 
  },
  rejected: { 
    label: 'Ditolak', 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: AlertCircle 
  },
  // Job statuses
  scheduled: { 
    label: 'Terjadwal', 
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    icon: Clock 
  },
  sampling: { 
    label: 'Sampling', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: MapPin 
  },
  analysis: { 
    label: 'Analisis', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: FlaskConical 
  },
  reporting: { 
    label: 'Pelaporan', 
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    icon: FileCheck 
  },
  completed: { 
    label: 'Selesai', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    icon: CheckCircle 
  },
};

export function ActivityTimeline({ 
  activities,
}: ActivityTimelineProps) {
  const getActivityIcon = (type: 'quotation' | 'job') => {
    return type === 'quotation' ? FileText : Briefcase;
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || {
      label: status,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      icon: Clock
    };
  };

  return (
    <Card className="border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-slate-50/80 to-emerald-50/80 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Riwayat penawaran dan order pekerjaan
              </CardDescription>
            </div>
          </div>
          <Link
            href="/admin/jobs"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 transition-all group"
          >
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Lihat Semua
            </span>
            <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const statusCfg = getStatusConfig(activity.status);
              const StatusIcon = statusCfg.icon;
              const isLast = index === activities.length - 1;

              return (
                <div key={activity.id} className="relative">
                  {/* Timeline connector */}
                  {!isLast && (
                    <div className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-slate-200 to-transparent" />
                  )}
                  
                  <Link
                    href={activity.type === 'quotation' ? `/admin/quotations/${activity.id}` : `/admin/jobs/${activity.id}`}
                    className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "relative h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110",
                      activity.type === 'quotation' 
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                        : "bg-gradient-to-br from-blue-500 to-indigo-500"
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                      
                      {/* Status indicator */}
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-5 w-5 rounded-lg border-2 border-white flex items-center justify-center",
                        statusCfg.bgColor
                      )}>
                        <StatusIcon className={cn("h-2.5 w-2.5", statusCfg.color)} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                              {activity.title}
                            </h4>
                            <Badge 
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border-none",
                                statusCfg.bgColor,
                                statusCfg.color
                              )}
                            >
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {activity.subtitle}
                          </p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          {activity.formattedAmount && (
                            <p className="text-sm font-black text-emerald-600">
                              {activity.formattedAmount}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 font-medium">
                            {activity.formattedTime || new Date(activity.timestamp).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="mt-3 flex items-center gap-2">
                          {activity.metadata.items > 0 && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                              {activity.metadata.items} item
                            </span>
                          )}
                          {activity.metadata.stage && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                              Stage: {activity.metadata.stage}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Belum ada aktivitas</p>
            <p className="text-slate-400 text-xs mt-1">
              Aktivitas akan muncul saat ada penawaran atau order baru
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
