"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  FileText,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMySamplingAssignments } from "@/lib/actions/sampling";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  useEffect(() => {
    loadAssignments();
  }, [statusFilter, pagination.page]);

  async function loadAssignments() {
    setLoading(true);
    const data = await getMySamplingAssignments(pagination.page, 10, statusFilter);
    if (data.items) {
      setAssignments(data.items);
      setPagination({
        page: pagination.page,
        total: data.total || 0,
        pages: data.pages || 0
      });
    }
    setLoading(false);
  }

  const filteredAssignments = assignments.filter((a: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      a.job_order?.tracking_code?.toLowerCase().includes(searchLower) ||
      a.location?.toLowerCase().includes(searchLower) ||
      a.job_order?.quotation?.profile?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-100 text-red-700 border-red-200"
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <Link href="/field" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Kembali</span>
        </Link>
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
          Daftar Assignment Sampling
        </h1>
        <p className="text-slate-500 text-sm">Kelola semua tugas pengambilan sampel Anda.</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari tracking code, lokasi, atau customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Tidak ada assignment yang ditemukan.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] shrink-0">
                      SMP
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-600 tracking-wider">
                          {assignment.job_order.tracking_code}
                        </span>
                        <Badge
                          className={cn(
                            "text-[8px] h-4 px-1.5 font-bold uppercase",
                            statusColors[assignment.status] || statusColors.pending
                          )}
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm truncate">
                        {assignment.job_order.quotation.items[0]?.service?.name || 'Sampling'}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {assignment.location}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Customer: {assignment.job_order.quotation.profile?.full_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/field/assignments/${assignment.id}`}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-9 px-5 text-xs font-bold">
                      Lihat Detail
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-slate-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
