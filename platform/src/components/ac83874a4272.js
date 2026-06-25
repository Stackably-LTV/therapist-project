import { formatDateKey } from '@/components/9e15c968ce4c';
const MIN_VISIBLE_HEIGHT = 44;
function overlaps(a, b) {
    return a.start < b.end && b.start < a.end;
}
function sameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
export function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}
export function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
export function startOfWeek(date) {
    const current = startOfDay(date);
    const day = current.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(current, diff);
}
export function getWeekDays(anchor) {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
}
export function dayBounds(date, startHour = 7, endHour = 21) {
    return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0, 0, 0),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, 0, 0, 0),
    };
}
function clampToBounds(interval, bounds) {
    const start = interval.start > bounds.start ? interval.start : bounds.start;
    const end = interval.end < bounds.end ? interval.end : bounds.end;
    if (end <= start)
        return null;
    return { start, end };
}
function minutesBetween(start, end) {
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}
function getClusterLayouts(cluster) {
    const sorted = [...cluster].sort((a, b) => {
        const byStart = a.start.getTime() - b.start.getTime();
        if (byStart !== 0)
            return byStart;
        return a.end.getTime() - b.end.getTime();
    });
    const active = [];
    const columns = new Map();
    let maxColumns = 1;
    for (const session of sorted) {
        for (let i = active.length - 1; i >= 0; i -= 1) {
            if (active[i].end <= session.start)
                active.splice(i, 1);
        }
        const used = new Set(active.map((item) => item.column));
        let column = 0;
        while (used.has(column))
            column += 1;
        active.push({ end: session.end, column });
        columns.set(session.id, column);
        if (active.length > maxColumns)
            maxColumns = active.length;
    }
    const output = new Map();
    for (const session of sorted) {
        output.set(session.id, { column: columns.get(session.id) ?? 0, columnCount: maxColumns });
    }
    return output;
}
function clusterOverlaps(sessions) {
    if (sessions.length === 0)
        return [];
    const sorted = [...sessions].sort((a, b) => a.start.getTime() - b.start.getTime());
    const clusters = [];
    let current = [];
    let clusterEnd = sorted[0].end;
    for (const session of sorted) {
        if (current.length === 0) {
            current.push(session);
            clusterEnd = session.end;
            continue;
        }
        if (session.start < clusterEnd) {
            current.push(session);
            if (session.end > clusterEnd)
                clusterEnd = session.end;
            continue;
        }
        clusters.push(current);
        current = [session];
        clusterEnd = session.end;
    }
    if (current.length > 0)
        clusters.push(current);
    return clusters;
}
export function getSessionsForDay(sessions, date) {
    return sessions
        .filter((session) => sameDay(session.start, date))
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}
export function getBlocksForDay(blocks, date) {
    const key = formatDateKey(date);
    return blocks
        .filter((block) => formatDateKey(block.start) === key)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}
export function buildDaySessionLayout(options) {
    const { sessions, blocks, day, hourHeight, startHour = 7, endHour = 21 } = options;
    const bounds = dayBounds(day, startHour, endHour);
    const daySessions = getSessionsForDay(sessions, day);
    const dayBlocks = getBlocksForDay(blocks, day);
    const clusters = clusterOverlaps(daySessions);
    const pixelPerMinute = hourHeight / 60;
    const layout = [];
    for (const cluster of clusters) {
        const clusterLayouts = getClusterLayouts(cluster);
        for (const session of cluster) {
            const clamped = clampToBounds({ start: session.start, end: session.end }, bounds);
            if (!clamped)
                continue;
            const top = minutesBetween(bounds.start, clamped.start) * pixelPerMinute;
            const height = Math.max(MIN_VISIBLE_HEIGHT, minutesBetween(clamped.start, clamped.end) * pixelPerMinute);
            const overlapMeta = clusterLayouts.get(session.id) ?? { column: 0, columnCount: 1 };
            const hasConflict = dayBlocks.some((block) => overlaps(session, block));
            layout.push({
                session,
                top,
                height,
                column: overlapMeta.column,
                columnCount: overlapMeta.columnCount,
                hasConflict,
            });
        }
    }
    return layout.sort((a, b) => a.top - b.top);
}
function mergeIntervals(intervals) {
    if (!intervals.length)
        return [];
    const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i += 1) {
        const prev = merged[merged.length - 1];
        const cur = sorted[i];
        if (cur.start <= prev.end) {
            if (cur.end > prev.end)
                prev.end = cur.end;
        }
        else {
            merged.push({ start: new Date(cur.start), end: new Date(cur.end) });
        }
    }
    return merged;
}
export function getDayGaps(options) {
    const { sessions, blocks, day, startHour = 7, endHour = 21, minGapMinutes = 45, } = options;
    const bounds = dayBounds(day, startHour, endHour);
    const intervals = [
        ...getSessionsForDay(sessions, day).map((session) => ({ start: session.start, end: session.end })),
        ...getBlocksForDay(blocks, day).map((block) => ({ start: block.start, end: block.end })),
    ]
        .map((interval) => clampToBounds(interval, bounds))
        .filter((value) => Boolean(value));
    const busy = mergeIntervals(intervals);
    if (busy.length === 0) {
        return [{ start: bounds.start, end: bounds.end, minutes: minutesBetween(bounds.start, bounds.end) }];
    }
    const gaps = [];
    let cursor = bounds.start;
    for (const item of busy) {
        if (item.start > cursor) {
            const minutes = minutesBetween(cursor, item.start);
            if (minutes >= minGapMinutes)
                gaps.push({ start: cursor, end: item.start, minutes });
        }
        if (item.end > cursor)
            cursor = item.end;
    }
    if (cursor < bounds.end) {
        const minutes = minutesBetween(cursor, bounds.end);
        if (minutes >= minGapMinutes)
            gaps.push({ start: cursor, end: bounds.end, minutes });
    }
    return gaps;
}
