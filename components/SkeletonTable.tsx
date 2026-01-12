interface SkeletonTableProps {
  rows?: number
}

export default function SkeletonTable({ rows = 3 }: SkeletonTableProps) {
  return (
    <div className="rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-5 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="h-4 w-20 bg-gray-200 rounded hidden sm:block" />
              <div className="h-8 w-24 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
