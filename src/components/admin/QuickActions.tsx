"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  Briefcase, 
  Users, 
  FlaskConical,
  X,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const quickActions = [
  {
    id: 'quotation',
    label: 'Penawaran Baru',
    icon: FileText,
    href: '/admin/quotations/new',
    color: 'from-emerald-500 to-teal-500',
    description: 'Buat penawaran baru'
  },
  {
    id: 'job',
    label: 'Order Baru',
    icon: Briefcase,
    href: '/admin/jobs',
    color: 'from-blue-500 to-indigo-500',
    description: 'Kelola order pekerjaan'
  },
  {
    id: 'customer',
    label: 'Tambah Klien',
    icon: Users,
    href: '/admin/customers',
    color: 'from-violet-500 to-purple-500',
    description: 'Tambah klien baru'
  },
  {
    id: 'service',
    label: 'Tambah Layanan',
    icon: FlaskConical,
    href: '/admin/services',
    color: 'from-amber-500 to-orange-500',
    description: 'Tambah layanan lab'
  },
];

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-[9999]">
      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-14 w-14 rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-[9999]",
          isOpen 
            ? "bg-slate-900 rotate-45" 
            : "bg-gradient-to-br from-emerald-500 to-teal-500 hover:shadow-xl hover:shadow-emerald-500/30"
        )}
      >
        <Plus className={cn(
          "h-6 w-6 transition-colors",
          isOpen ? "text-white rotate-45" : "text-white"
        )} />
      </button>

      {/* Action Items */}
      <div className={cn(
        "absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300 z-[9998]",
        isOpen 
          ? "opacity-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {quickActions.map((action, index) => (
          <Link
            key={action.id}
            href={action.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "group flex items-center gap-3 p-4 pr-5 rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 hover:-translate-x-1 min-w-[240px]",
              "animate-in fade-in slide-in-from-bottom-2",
              `delay-${index * 50}`
            )}
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6",
              `bg-gradient-to-br ${action.color}`
            )}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-slate-500">
                {action.description}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9997]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
