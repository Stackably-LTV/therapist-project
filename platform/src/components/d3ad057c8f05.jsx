export default function Loading() {
    return (<div className="mx-auto w-full max-w-6xl px-4 py-10 space-y-6">
      <div className="h-10 w-40 rounded-lg bg-gray-100"/>
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <div className="h-7 w-2/3 rounded bg-gray-100"/>
        <div className="h-4 w-1/2 rounded bg-gray-100"/>
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 rounded-lg border bg-gray-50"/>))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <div className="h-6 w-48 rounded bg-gray-100"/>
        {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-20 rounded-lg border bg-gray-50"/>))}
      </div>
    </div>);
}
