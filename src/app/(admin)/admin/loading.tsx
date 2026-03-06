import { PageSkeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="p-4 md:p-8">
      <PageSkeleton />
    </div>
  );
}
