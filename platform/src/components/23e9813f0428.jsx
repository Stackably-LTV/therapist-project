export default function TherapistsLoading() {
    return (<div className="space-y-8 animate-pulse">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 p-8 md:p-12">
        <div className="h-8 w-72 rounded bg-white/70"/>
        <div className="mt-3 h-5 w-full max-w-2xl rounded bg-white/60"/>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (<div key={idx} className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-100"/>
              <div className="h-10 w-full rounded bg-gray-100"/>
            </div>))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (<div key={idx} className="rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-100"/>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 rounded bg-gray-100"/>
                <div className="h-4 w-28 rounded bg-gray-100"/>
              </div>
            </div>
            <div className="h-4 w-full rounded bg-gray-100"/>
            <div className="mt-2 h-4 w-5/6 rounded bg-gray-100"/>
            <div className="mt-4 flex gap-2">
              <div className="h-9 flex-1 rounded bg-gray-100"/>
              <div className="h-9 flex-1 rounded bg-gray-100"/>
            </div>
          </div>))}
      </div>
    </div>);
}
