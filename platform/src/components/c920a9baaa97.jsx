export default function Loading() {
    return (<div className="space-y-8">
      <div className="h-10 w-64 rounded-lg bg-gray-100"/>
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <div className="h-6 w-32 rounded bg-gray-100"/>
        <div className="h-4 w-48 rounded bg-gray-100"/>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-12 rounded-lg bg-gray-50"/>))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <div className="h-6 w-40 rounded bg-gray-100"/>
        {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-16 rounded-lg border bg-gray-50"/>))}
      </div>
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <div className="h-6 w-36 rounded bg-gray-100"/>
        <div className="h-12 rounded-lg bg-gray-50"/>
      </div>
    </div>);
}
