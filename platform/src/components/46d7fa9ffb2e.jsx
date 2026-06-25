import { Clock } from 'lucide-react';
import { buildDaySessionLayout, dayBounds, getBlocksForDay, getDayGaps } from '@/components/ac83874a4272';
import { SessionBlock } from '@/components/db70cb3d63b9';
const HOUR_HEIGHT = 66;
const START_HOUR = 7;
const END_HOUR = 21;
export function TherapistDayTimeline({ date, sessions, blocks, onEditSession, onEmptySlotClick, }) {
    const layout = buildDaySessionLayout({
        sessions,
        blocks,
        day: date,
        hourHeight: HOUR_HEIGHT,
        startHour: START_HOUR,
        endHour: END_HOUR,
    });
    const dayBlocks = getBlocksForDay(blocks, date);
    const gaps = getDayGaps({ sessions, blocks, day: date, startHour: START_HOUR, endHour: END_HOUR });
    const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
    const bounds = dayBounds(date, START_HOUR, END_HOUR);
    return (<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-xs text-slate-500">Day timeline with overlapping sessions and protected blocks.</p>
      </div>

      <div className="grid grid-cols-[72px_minmax(0,1fr)]">
        <div className="border-r border-slate-200">
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((hour) => (<div key={hour} className="relative border-b border-slate-100 pr-2 text-right text-[11px] text-slate-500" style={{ height: `${HOUR_HEIGHT}px` }}>
              <span className="relative -top-2 inline-block">
                {new Date(2026, 0, 1, hour, 0, 0).toLocaleTimeString('en-US', { hour: 'numeric' })}
              </span>
            </div>))}
        </div>

        <div className="relative cursor-crosshair" style={{ height: `${totalHeight}px` }} onClick={(event) => {
            const target = event.target;
            if (target.closest('[data-session-block="true"]'))
                return;
            const rect = event.currentTarget.getBoundingClientRect();
            const y = event.clientY - rect.top;
            const minutesFromStart = (y / HOUR_HEIGHT) * 60;
            const roundedMinutes = Math.max(0, Math.min((END_HOUR - START_HOUR) * 60, Math.round(minutesFromStart / 15) * 15));
            const nextDate = new Date(date);
            nextDate.setHours(START_HOUR, 0, 0, 0);
            nextDate.setMinutes(roundedMinutes);
            onEmptySlotClick(nextDate);
        }}>
          {Array.from({ length: END_HOUR - START_HOUR }, (_, idx) => (<div key={idx} className="border-b border-slate-100" style={{ height: `${HOUR_HEIGHT}px` }}/>))}

          {dayBlocks.map((block) => {
            const top = ((block.start.getTime() - bounds.start.getTime()) / 60000) * (HOUR_HEIGHT / 60);
            const height = ((block.end.getTime() - block.start.getTime()) / 60000) * (HOUR_HEIGHT / 60);
            return (<div key={block.id} className="pointer-events-none absolute left-2 right-2 rounded-md border border-amber-300 bg-amber-100/50" style={{ top: `${top}px`, height: `${Math.max(20, height)}px` }}/>);
        })}

          {layout.map((item) => {
            const width = `${100 / item.columnCount}%`;
            const left = `${(100 / item.columnCount) * item.column}%`;
            return (<div key={item.session.id} className="absolute px-1.5" style={{ top: `${item.top}px`, left, width, height: `${item.height}px` }}>
                <SessionBlock session={item.session} hasConflict={item.hasConflict} onEdit={onEditSession}/>
              </div>);
        })}

          {gaps.map((gap) => {
            const top = ((gap.start.getTime() - bounds.start.getTime()) / 60000) * (HOUR_HEIGHT / 60);
            return (<div key={`${gap.start.toISOString()}-${gap.end.toISOString()}`} className="pointer-events-none absolute left-2 right-2 flex items-center gap-1 rounded-md border border-dashed border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800" style={{ top: `${top + 6}px` }}>
                <Clock className="h-3 w-3"/>
                {Math.floor(gap.minutes / 60)}h {gap.minutes % 60}m availability gap
              </div>);
        })}
        </div>
      </div>
    </div>);
}
