export default function SeekerProfileLoading() {
    return (<div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-9 w-56 rounded bg-gray-100"/>
        <div className="h-5 w-80 rounded bg-gray-100"/>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, idx) => (<div key={idx} className="space-y-2">
              <div className="h-4 w-28 rounded bg-gray-100"/>
              <div className="h-10 w-full rounded bg-gray-100"/>
            </div>))}
        </div>
        <div className="mt-6 h-10 w-40 rounded bg-gray-100"/>
      </div>
    </div>);
}
