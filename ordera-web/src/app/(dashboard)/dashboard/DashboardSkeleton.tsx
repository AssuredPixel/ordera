'use client';

export default function DashboardSkeleton() {
  return (
    <div className="p-10 space-y-10 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-32 bg-gray-100 rounded-md"></div>
      </div>

      {/* TABS SKELETON */}
      <div className="flex gap-4 border-b border-gray-100 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-16 bg-gray-100 rounded-md"></div>
        ))}
      </div>

      {/* ROW 1 SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-white rounded-3xl border border-gray-100 p-8 flex flex-col gap-6 font-sans">
            <div className="h-6 w-32 bg-gray-100 rounded"></div>
            <div className="flex-1 bg-gray-50 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2 h-[200px] bg-white rounded-3xl border border-gray-100 p-8 flex flex-col gap-6">
                <div className="h-6 w-32 bg-gray-100 rounded"></div>
                <div className="flex-1 bg-gray-50 rounded-xl"></div>
            </div>
            <div className="h-[170px] bg-white rounded-3xl border border-gray-100 p-8 flex flex-col gap-4">
                <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
                <div className="h-4 w-16 bg-gray-50 rounded"></div>
            </div>
            <div className="h-[170px] bg-white rounded-3xl border border-gray-100 p-8 flex flex-col gap-4">
                <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
                <div className="h-4 w-16 bg-gray-50 rounded"></div>
            </div>
        </div>
      </div>

      {/* ROW 2 SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {[1, 2].map((card) => (
          <div key={card} className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6">
            <div className="h-6 w-40 bg-gray-100 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                    <div className="h-3 w-1/4 bg-gray-50 rounded"></div>
                  </div>
                  <div className="h-4 w-16 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
