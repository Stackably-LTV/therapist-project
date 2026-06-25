export default function SeekerCoursesLoading() {
    return (<div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-10">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-56 rounded bg-gray-100"/>
        <div className="h-5 w-72 rounded bg-gray-100"/>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (<div key={idx} className="rounded-xl border bg-white p-6">
            <div className="h-6 w-4/5 rounded bg-gray-100"/>
            <div className="mt-3 h-4 w-full rounded bg-gray-100"/>
            <div className="mt-2 h-4 w-2/3 rounded bg-gray-100"/>
            <div className="mt-6 h-9 w-20 rounded bg-gray-100"/>
          </div>))}
      </div>
    </div>);
}
