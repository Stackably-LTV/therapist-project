'use client';
export function LocalTime({ dateStr, variant = 'time', className }) {
    const d = new Date(dateStr);
    let formatted;
    switch (variant) {
        case 'time':
            formatted = d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });
            break;
        case 'date':
            formatted = d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            break;
        case 'short-date':
            formatted = d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            break;
        case 'datetime':
            formatted = `${d.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            })} at ${d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            })}`;
            break;
    }
    return <span className={className}>{formatted}</span>;
}
/**
 * Returns the short month, day number, and short weekday for a date card.
 * Renders client-side so the correct local date is used.
 */
export function LocalDateCard({ dateStr, className }) {
    const d = new Date(dateStr);
    return (<div className={className}>
      <span className="text-sm font-bold text-blue-600 uppercase">
        {d.toLocaleDateString('en-US', { month: 'short' })}
      </span>
      <span className="text-3xl font-bold text-gray-900">
        {d.getDate()}
      </span>
      <span className="text-sm text-gray-500">
        {d.toLocaleDateString('en-US', { weekday: 'short' })}
      </span>
    </div>);
}
/**
 * Returns a time range like "2:30 PM - 3:30 PM" in the user's local timezone.
 */
export function LocalTimeRange({ dateStr, durationMinutes, className, }) {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const fmt = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return <span className={className}>{fmt(start)} - {fmt(end)}</span>;
}
