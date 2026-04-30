import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalystLoading() {
  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto space-y-10">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-1 rounded-full" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-4 w-48 ml-4" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </CardHeader>
            <CardContent className="pt-2">
              <Skeleton className="h-12 w-16 mb-4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-1 flex-1 rounded-full" />
                <Skeleton className="h-2 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card Skeleton */}
      <Card className="shadow-3xl border-none rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 p-8 md:p-10 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-14 w-full sm:w-80 rounded-2xl" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-2xl hidden md:block" />
                <Skeleton className="h-12 w-32 rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
