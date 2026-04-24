"use client";

import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Sparkline } from './Sparkline';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  FileText: (props: any) => {
    const Icon = require('lucide-react').FileText;
    return <Icon {...props} />;
  },
  Briefcase: (props: any) => {
    const Icon = require('lucide-react').Briefcase;
    return <Icon {...props} />;
  },
  Users: (props: any) => {
    const Icon = require('lucide-react').Users;
    return <Icon {...props} />;
  },
  Banknote: (props: any) => {
    const Icon = require('lucide-react').Banknote;
    return <Icon {...props} />;
  },
};

interface PremiumStatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof iconMap;
  gradient: string;
  trend?: number;
  trendLabel?: string;
  sparkline?: number[];
  status?: 'positive' | 'negative' | 'neutral' | 'active';
  isCurrency?: boolean;
  quickAction?: {
    label: string;
    href: string;
  };
  compact?: boolean;
}

export function PremiumStatCard({
  title,
  value,
  icon: iconName,
  gradient,
  trend,
  trendLabel,
  sparkline,
  status = 'neutral',
  isCurrency = false,
  quickAction,
  compact = false,
}: PremiumStatCardProps) {
  const Icon = iconMap[iconName];
  const trendColor = trend && trend >= 0 ? 'text-emerald-600' : 'text-red-600';
  const trendBgColor = trend && trend >= 0 ? 'bg-emerald-50' : 'bg-red-50';
  
  return (
    <div className={cn(
      "group relative bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-500 hover:-translate-y-1",
      compact ? "rounded-2xl" : "rounded-3xl"
    )}>
      {/* Gradient Background Glow */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
        gradient
      )} />
      
      {/* Status Indicator */}
      {status === 'active' && (
        <div className={cn("absolute", compact ? "top-3 right-3" : "top-4 right-4")}>
          <span className={cn("relative flex", compact ? "h-2.5 w-2.5" : "h-3 w-3")}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className={cn("relative inline-flex rounded-full bg-emerald-500", compact ? "h-2.5 w-2.5" : "h-3 w-3")}></span>
          </span>
        </div>
      )}

      <div className={cn("relative", compact ? "p-4" : "p-6")}>
        {/* Icon & Title */}
        <div className={cn("flex items-start justify-between", compact ? "mb-3" : "mb-4")}>
          <div className={cn(
            "rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110",
            compact ? "h-11 w-11" : "h-14 w-14",
            `bg-gradient-to-br ${gradient}`
          )}>
            <Icon className={cn("text-white", compact ? "h-5 w-5" : "h-7 w-7")} />
          </div>
          
          {quickAction && (
            <Link
              href={quickAction.href}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group/btn"
            >
              <MoreVertical className="h-4 w-4 text-slate-400 group-hover/btn:text-emerald-600 transition-colors" />
            </Link>
          )}
        </div>

        {/* Value */}
        <div className={cn(compact ? "mb-3" : "mb-4")}>
          <h3 className={cn(
            "font-black uppercase tracking-[0.2em] text-slate-400",
            compact ? "text-[9px] mb-1.5" : "text-[10px] mb-2"
          )}>
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "font-black text-slate-900 tracking-tighter",
              compact ? "text-3xl" : "text-4xl"
            )}>
              {typeof value === 'number' && !isCurrency 
                ? value.toLocaleString('id-ID') 
                : value}
            </span>
          </div>
        </div>

        {/* Sparkline Mini Chart */}
        {sparkline && sparkline.length > 0 && (
          <div className={cn(compact ? "mb-3 h-10" : "mb-4 h-12")}>
            <Sparkline 
              data={sparkline} 
              color={gradient.split(' ')[1].replace('to-', '')}
            />
          </div>
        )}

        {/* Trend Indicator */}
        {trend !== undefined && (
          <div className="flex items-center gap-2">
            <span className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
              trendColor,
              trendBgColor
            )}>
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {trendLabel}
            </span>
          </div>
        )}

        {/* Quick Action Button */}
        {quickAction && (
          <Link
            href={quickAction.href}
            className={cn(
              "w-full rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all flex items-center justify-between group/btn",
              compact ? "mt-3 p-2.5" : "mt-4 p-3"
            )}
          >
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {quickAction.label}
            </span>
            <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover/btn:text-emerald-600 transition-colors" />
          </Link>
        )}
      </div>

      {/* Bottom Gradient Border */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        gradient
      )} />
    </div>
  );
}
