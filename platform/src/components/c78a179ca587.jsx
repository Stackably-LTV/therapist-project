import { buildDaySessionLayout, dayBounds, getBlocksForDay, getDayGaps } from '@/components/ac83874a4272';
import { formatDateKey } from '@/components/9e15c968ce4c';
import { SessionBlock } from '@/components/db70cb3d63b9';
const HOUR_HEIGHT = 56;
const START_HOUR = 7;
const END_HOUR = 21;
function formatHour(hour) {
    const date = new Date(2026, 0, 1, hour, 0, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric' });
}
function isToday(date) {
    const now = new Date();
    return formatDateKey(date) === formatDateKey(now);
}
export function TherapistWeekGrid({ weekDays, sessions, blocks, onEditSession, onSelectDay, onEmptySlotClick, selectedDate, }) {
    const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
    const now = new Date();
    return (<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-200">
          <div className="px-2 py-3 text-xs font-medium text-slate-500">Time</div>
          {weekDays.map((day) => {
            const active = formatDateKey(day) === formatDateKey(selectedDate);
            return (<button key={day.toISOString()} className={`px-2 py-3 text-left transition-colors ${active ? 'bg-indigo-50' : 'hover:bg-slate-50'}`} onClick={() => onSelectDay(day)}>
                <p className="text-xs font-medium text-slate-500">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </button>);
        })}
        </div>

        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
          <div className="border-r border-slate-200">
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((hour) => (<div key={hour} className="relative border-b border-slate-100 pr-2 text-right text-[11px] text-slate-500" style={{ height: `${HOUR_HEIGHT}px` }}>
                <span className="relative -top-2 inline-block">{formatHour(hour)}</span>
              </div>))}
          </div>

          {weekDays.map((day) => {
            const layout = buildDaySessionLayout({
                sessions,
                blocks,
                day,
                hourHeight: HOUR_HEIGHT,
                startHour: START_HOUR,
                endHour: END_HOUR,
            });
            const dayBlocks = getBlocksForDay(blocks, day);
            const bounds = dayBounds(day, START_HOUR, END_HOUR);
            const gaps = getDayGaps({ sessions, blocks, day, startHour: START_HOUR, endHour: END_HOUR });
            const nowTop = isToday(day) && now >= bounds.start && now <= bounds.end
                ? ((now.getTime() - bounds.start.getTime()) / 60000) * (HOUR_HEIGHT / 60)
                : null;
            return (<div key={day.toISOString()} className="relative border-r border-slate-200 last:border-r-0">
                <div className="relative cursor-crosshair" style={{ height: `${totalHeight}px` }} onClick={(event) => {
                    const target = event.target;
                    if (target.closest('[data-session-block="true"]'))
                        return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    const y = event.clientY - rect.top;
                    const minutesFromStart = (y / HOUR_HEIGHT) * 60;
                    const roundedMinutes = Math.max(0, Math.min((END_HOUR - START_HOUR) * 60, Math.round(minutesFromStart / 15) * 15));
                    const nextDate = new Date(day);
                    nextDate.setHours(START_HOUR, 0, 0, 0);
                    nextDate.setMinutes(roundedMinutes);
                    onEmptySlotClick(nextDate);
                }}>
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, idx) => (<div key={idx} className="border-b border-slate-100" style={{ height: `${HOUR_HEIGHT}px` }} aria-hidden="true"/>))}

                  {dayBlocks.map((block) => {
                    const top = ((block.start.getTime() - bounds.start.getTime()) / 60000) * (HOUR_HEIGHT / 60);
                    const height = ((block.end.getTime() - block.start.getTime()) / 60000) * (HOUR_HEIGHT / 60);
                    return (<div key={block.id} className="pointer-events-none absolute left-1 right-1 rounded-md border border-amber-300 bg-amber-100/50" style={{ top: `${top}px`, height: `${Math.max(20, height)}px` }} aria-label="Blocked time"/>);
                })}

                  {layout.map((item) => {
                    const width = `${100 / item.columnCount}%`;
                    const left = `${(100 / item.columnCount) * item.column}%`;
                    return (<div key={item.session.id} className="absolute px-1" style={{ top: `${item.top}px`, left, width, height: `${item.height}px` }}>
                        <SessionBlock session={item.session} compact hasConflict={item.hasConflict} onEdit={onEditSession}/>
                      </div>);
                })}

                  {gaps.slice(0, 2).map((gap) => {
                    const top = ((gap.start.getTime() - bounds.start.getTime()) / 60000) * (HOUR_HEIGHT / 60) + 4;
                    return (<div key={`${gap.start.toISOString()}-${gap.end.toISOString()}`} className="pointer-events-none absolute left-1 right-1 rounded-md border border-dashed border-emerald-300 bg-emerald-50 px-1 py-0.5 text-[10px] text-emerald-800" style={{ top: `${top}px` }}>
                        {Math.floor(gap.minutes / 60)}h {gap.minutes % 60}m gap
                      </div>);
                })}

                  {nowTop !== null ? (<div className="pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-rose-500" style={{ top: `${nowTop}px` }}/>) : null}
                </div>
              </div>);
        })}
        </div>
      </div>
    </div>);
}
