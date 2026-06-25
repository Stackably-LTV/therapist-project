import { useMemo } from 'react';
import { Calendar } from '@/components/111083d11e1f';
import { formatDateKey } from '@/components/9e15c968ce4c';
export function TherapistMonthOverview({ selectedDate, onSelectDate, sessions, blocks, }) {
    const counts = useMemo(() => {
        const map = new Map();
        for (const session of sessions) {
            const key = formatDateKey(session.start);
            const prev = map.get(key) ?? { sessions: 0, blocks: 0 };
            prev.sessions += 1;
            map.set(key, prev);
        }
        for (const block of blocks) {
            const key = formatDateKey(block.start);
            const prev = map.get(key) ?? { sessions: 0, blocks: 0 };
            prev.blocks += 1;
            map.set(key, prev);
        }
        return map;
    }, [sessions, blocks]);
    const busyDays = useMemo(() => Array.from(counts.entries())
        .filter(([, value]) => value.sessions > 0 || value.blocks > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 8), [counts]);
    const modifiers = {
        busy: (date) => {
            const key = formatDateKey(date);
            const value = counts.get(key);
            return Boolean(value && value.sessions > 0);
        },
        blocked: (date) => {
            const key = formatDateKey(date);
            const value = counts.get(key);
            return Boolean(value && value.blocks > 0);
        },
    };
    return (<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && onSelectDate(date)} modifiers={modifiers} modifiersClassNames={{
            busy: 'relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-indigo-600',
            blocked: 'relative before:absolute before:bottom-1 before:left-1/2 before:h-1.5 before:w-1.5 before:-translate-x-1/2 before:rounded-full before:bg-amber-500 before:translate-y-2',
        }} className="w-full" classNames={{
            day_selected: 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white rounded-lg',
            day: 'h-11 w-full text-sm text-slate-700 hover:bg-slate-50 rounded-lg',
            head_cell: 'text-slate-500 text-[11px] uppercase tracking-wide',
        }}/>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Month workload</h3>
        <p className="mt-1 text-xs text-slate-500">High-level overview only. Select a day for timeline detail.</p>
        <div className="mt-3 space-y-2">
          {busyDays.length === 0 ? (<p className="text-xs text-slate-500">No busy days in this month.</p>) : (busyDays.map(([key, value]) => (<button key={key} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-2 py-1.5 text-left hover:bg-slate-50" onClick={() => onSelectDate(new Date(`${key}T12:00:00`))}>
                <span className="text-xs font-medium text-slate-800">
                  {new Date(`${key}T12:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            })}
                </span>
                <span className="text-[11px] text-slate-600">
                  {value.sessions} sessions{value.blocks ? ` • ${value.blocks} blocks` : ''}
                </span>
              </button>)))}
        </div>
      </div>
    </div>);
}
