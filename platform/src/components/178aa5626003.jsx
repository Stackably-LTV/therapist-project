export default function SeekerBookingsLoading() {
    return (<div className="mx-auto max-w-5xl space-y-8 animate-pulse">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-9 w-56 rounded bg-gray-100"/>
          <div className="h-5 w-80 rounded bg-gray-100"/>
        </div>
        <div className="h-11 w-44 rounded bg-gray-100"/>
      </div>

      <div className="h-10 w-80 rounded bg-gray-100"/>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, idx) => (<div key={idx} className="rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-44 rounded bg-gray-100"/>
              <div className="h-6 w-20 rounded bg-gray-100"/>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="h-4 rounded bg-gray-100"/>
              <div className="h-4 rounded bg-gray-100"/>
              <div className="h-4 rounded bg-gray-100"/>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <div className="h-9 w-28 rounded bg-gray-100"/>
              <div className="h-9 w-28 rounded bg-gray-100"/>
            </div>
          </div>))}
      </div>
    </div>);
}
