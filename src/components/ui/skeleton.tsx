import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton loading placeholder
 * Used to show content structure while data is loading
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700", className)}
      {...props}
    />
  )
}

/**
 * Skeleton for table rows (quotations, job orders, etc.)
 */
export function SkeletonTableRow() {
  return (
    <tr className="border-b border-neutral-200 dark:border-neutral-700">
      <td className="p-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-48" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-20" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="p-4">
        <Skeleton className="h-8 w-24" />
      </td>
    </tr>
  )
}

/**
 * Skeleton for table with multiple rows
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="rounded-md border border-neutral-200 dark:border-neutral-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
              <th className="p-4 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="p-4 text-left">
                <Skeleton className="h-4 w-32" />
              </th>
              <th className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="p-4 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="p-4 text-right">
                <Skeleton className="h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Skeleton for card layout
 */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton for card grid
 */
export function SkeletonCardGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(cards)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for dashboard stats
 */
export function SkeletonStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for form fields
 */
export function SkeletonForm() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

/**
 * Skeleton for list items
 */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-neutral-200 dark:border-neutral-700">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  )
}

/**
 * Skeleton for list with multiple items
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-700">
      {[...Array(items)].map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for detail page header
 */
export function SkeletonDetailHeader() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton for quotation/items detail
 */
export function SkeletonQuotationDetail() {
  return (
    <div className="space-y-6">
      <SkeletonDetailHeader />
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      
      <div className="rounded-md border border-neutral-200 dark:border-neutral-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
              <th className="p-4 text-left"><Skeleton className="h-4 w-32" /></th>
              <th className="p-4 text-right"><Skeleton className="h-4 w-16" /></th>
              <th className="p-4 text-right"><Skeleton className="h-4 w-20" /></th>
              <th className="p-4 text-right"><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="border-b border-neutral-200 dark:border-neutral-700">
                <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                <td className="p-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                <td className="p-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                <td className="p-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
