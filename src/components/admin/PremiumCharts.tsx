"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign } from "lucide-react";

interface PremiumChartsProps {
  quotationTrend: any[];
  jobStatus: any[];
  revenueData?: any[];
}

const COLORS = [
  "#059669", // emerald-600
  "#10b981", // emerald-500
  "#34d399", // emerald-400
  "#6ee7b7", // emerald-300
  "#a7f3d0", // emerald-200
  "#d1fae5", // emerald-100
];

const STATUS_COLORS: Record<string, string> = {
  sampling: "#f59e0b",    // amber-500
  analysis: "#3b82f6",    // blue-500
  reporting: "#8b5cf6",   // violet-500
  completed: "#10b981",   // emerald-500
  scheduled: "#64748b",   // slate-500
};

export function PremiumCharts({ quotationTrend, jobStatus, revenueData = [] }: PremiumChartsProps) {
  // Custom Tooltip for AreaChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-lg font-black text-slate-900">
            {payload[0].value} Penawaran
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for BarChart
  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-lg font-black text-emerald-600">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart Tren Penawaran - Enhanced */}
      <Card className="lg:col-span-2 border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Tren Penawaran</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Performa 6 bulan terakhir
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quotationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  activeDot={{
                    r: 6,
                    fill: '#10b981',
                    stroke: '#fff',
                    strokeWidth: 3
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart Status Job Order - Enhanced */}
      <Card className="border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Status Order</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Distribusi pekerjaan
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[320px] w-full flex flex-col items-center justify-center">
            {jobStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jobStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {jobStatus.map((entry, index) => {
                      // Use status-based color if available
                      const color = STATUS_COLORS[entry.name?.toLowerCase()] || COLORS[index % COLORS.length];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={color}
                          className="transition-opacity hover:opacity-80"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ 
                      paddingTop: '24px', 
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                    formatter={(value) => (
                      <span className="text-slate-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-slate-300" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Belum ada data pekerjaan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend Chart - NEW */}
      {revenueData && revenueData.length > 0 && (
        <Card className="lg:col-span-3 border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Tren Pendapatan</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Revenue 6 bulan terakhir
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="url(#colorRevenue)"
                    radius={[8, 8, 0, 0]}
                    activeBar={{
                      fill: '#f59e0b',
                      stroke: '#fbbf24',
                      strokeWidth: 2
                    }}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
