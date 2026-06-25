export function SeekerModulePage({ title, description, stats, notices, actions, sections, }) {
    return (<div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description ? <p className="text-sm text-gray-600">{description}</p> : null}
      </header>

      {actions?.length ? (<div className="flex flex-wrap items-center gap-3">
          {actions.map((action) => (<div key={action.key}>{action.node}</div>))}
        </div>) : null}

      {stats?.length ? (<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (<article key={stat.label} className="rounded-lg border bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
              {stat.hint ? <p className="mt-1 text-xs text-gray-500">{stat.hint}</p> : null}
            </article>))}
        </section>) : null}

      {notices?.length ? (<section className="space-y-2">
          {notices.map((notice, idx) => (<div key={`${notice.text}-${idx}`} className={[
                    'rounded-lg border p-3 text-sm',
                    notice.tone === 'success' && 'border-green-200 bg-green-50 text-green-800',
                    notice.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-800',
                    notice.tone === 'danger' && 'border-red-200 bg-red-50 text-red-800',
                    (!notice.tone || notice.tone === 'default') && 'border-gray-200 bg-gray-50 text-gray-700',
                ]
                    .filter(Boolean)
                    .join(' ')}>
              {notice.text}
            </div>))}
        </section>) : null}

      <section className="space-y-4">
        {sections.map((section) => (<article key={section.key} className="rounded-lg border bg-white">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
              {section.description ? (<p className="mt-0.5 text-sm text-gray-600">{section.description}</p>) : null}
            </div>
            <div className="p-4">{section.content}</div>
          </article>))}
      </section>
    </div>);
}
