export default function SeekerDashboardLoading() {
    return (<div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-9 w-72 rounded bg-gray-100"/>
        <div className="h-5 w-80 rounded bg-gray-100"/>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (<div key={idx} className="rounded-lg border bg-white p-6">
            <div className="h-4 w-28 rounded bg-gray-100"/>
            <div className="mt-4 h-8 w-20 rounded bg-gray-100"/>
            <div className="mt-3 h-2 w-full rounded bg-gray-100"/>
          </div>))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (<div key={idx} className="rounded-lg border bg-white p-6">
            <div className="h-7 w-40 rounded bg-gray-100"/>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((__, row) => (<div key={row} className="h-16 rounded bg-gray-100"/>))}
            </div>
          </div>))}
      </div>
    </div>);
}
