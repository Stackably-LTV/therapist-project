import { AlertTriangle, Clock, MapPin, Pencil, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/2795b661f080';
import { Badge } from '@/components/30348591d689';
import { getSessionTypeColor } from '@/components/9e15c968ce4c';
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
export function SessionBlock({ session, compact = false, hasConflict = false, onEdit }) {
    const color = getSessionTypeColor(session.sessionType);
    const title = session.client?.name || 'Private Session';
    return (<div data-session-block="true" className={`rounded-xl border p-2 shadow-sm ${color.cardClassName} ${hasConflict ? 'ring-2 ring-rose-300 border-rose-300' : ''}`} role="button" tabIndex={0} aria-label={`${title} at ${formatTime(session.start)}`} onClick={(event) => {
            event.stopPropagation();
            onEdit(session);
        }} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onEdit(session);
            }
        }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`truncate text-xs font-semibold ${color.textClassName}`}>{title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-700">
            <Clock className="h-3 w-3"/>
            {formatTime(session.start)} - {formatTime(session.end)}
          </p>
        </div>
        {hasConflict ? (<AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-label="Has conflict"/>) : null}
      </div>

      {!compact ? (<div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge className="bg-white/80 text-slate-700 border border-slate-200 capitalize">
            {session.status.replaceAll('_', ' ')}
          </Badge>
          <Badge className="bg-white/80 text-slate-700 border border-slate-200 capitalize">
            {session.sessionType.replaceAll('_', ' ')}
          </Badge>
          {session.locationType === 'telehealth' ? (<span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <Video className="h-3 w-3"/> Virtual
            </span>) : (<span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <MapPin className="h-3 w-3"/> In person
            </span>)}
        </div>) : null}

      {!compact ? (<div className="mt-2 flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs" onClick={(event) => {
                event.stopPropagation();
                onEdit(session);
            }}>
            <Pencil className="h-3 w-3"/>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs">
            <Link href={`/therapist/sessions/${session.id}`}>Open</Link>
          </Button>
        </div>) : null}
    </div>);
}
