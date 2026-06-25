import { Card, CardContent } from '@/components/c0ebd3fbafc6';
import { SESSION_TYPE_COLORS } from '@/components/9e15c968ce4c';
export function CalendarLegend() {
    const entries = Object.values(SESSION_TYPE_COLORS);
    return (<Card className="rounded-2xl border-slate-200">
      <CardContent className="space-y-4 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Legend</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {entries.map((entry) => (<div key={entry.label} className="flex items-center gap-2 text-xs text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${entry.dotClassName}`} aria-hidden="true"/>
              <span>{entry.label}</span>
            </div>))}
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true"/>
            <span>Unavailable / Blocked</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true"/>
            <span>Conflict</span>
          </div>
        </div>
      </CardContent>
    </Card>);
}
