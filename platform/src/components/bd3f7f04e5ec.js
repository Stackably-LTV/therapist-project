const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const MS_PER_DAY = 24 * MS_PER_HOUR;
function parseDateKey(dateKey) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!match)
        return null;
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    if (!y || !m || !d)
        return null;
    return { y, m, d };
}
export function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function formatDateKeyFromUtcMs(utcMs, tzOffsetMinutes) {
    // Convert UTC instant -> local calendar date in the seeker timezone
    const localMs = utcMs - tzOffsetMinutes * MS_PER_MIN;
    const local = new Date(localMs);
    const y = local.getUTCFullYear();
    const m = String(local.getUTCMonth() + 1).padStart(2, '0');
    const d = String(local.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function timeToMinutes(time) {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match)
        return null;
    const hh = Number(match[1]);
    const mm = Number(match[2]);
    if (Number.isNaN(hh) || Number.isNaN(mm))
        return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59)
        return null;
    return hh * 60 + mm;
}
function localDateKeyTimeToUtcMs(dateKey, minutesSinceMidnight, tzOffsetMinutes) {
    const parts = parseDateKey(dateKey);
    if (!parts)
        throw new Error(`Invalid dateKey: ${dateKey}`);
    const hh = Math.floor(minutesSinceMidnight / 60);
    const mm = minutesSinceMidnight % 60;
    // Take the local calendar date/time and shift it into UTC by applying tzOffsetMinutes.
    return Date.UTC(parts.y, parts.m - 1, parts.d, hh, mm, 0, 0) + tzOffsetMinutes * MS_PER_MIN;
}
function dateKeyToDayOfWeek(dateKey) {
    const parts = parseDateKey(dateKey);
    if (!parts)
        throw new Error(`Invalid dateKey: ${dateKey}`);
    return new Date(Date.UTC(parts.y, parts.m - 1, parts.d)).getUTCDay();
}
export function getUtcRangeForLocalDateKeys(startDateKey, endDateKey, tzOffsetMinutes) {
    const startParts = parseDateKey(startDateKey);
    const endParts = parseDateKey(endDateKey);
    if (!startParts || !endParts)
        throw new Error('Invalid startDateKey/endDateKey');
    const startMs = Date.UTC(startParts.y, startParts.m - 1, startParts.d, 0, 0, 0, 0) + tzOffsetMinutes * MS_PER_MIN;
    const endMs = Date.UTC(endParts.y, endParts.m - 1, endParts.d, 23, 59, 59, 999) + tzOffsetMinutes * MS_PER_MIN;
    return { rangeStart: new Date(startMs), rangeEnd: new Date(endMs) };
}
export function getMinBookableAtMs(therapistCreatedAt) {
    const created = therapistCreatedAt ? new Date(therapistCreatedAt) : null;
    const createdMs = created && !Number.isNaN(created.getTime()) ? created.getTime() : Date.now();
    return createdMs + 48 * MS_PER_HOUR;
}
function toMinuteKey(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}
export function computeAvailability(input) {
    const nowMs = typeof input.nowMs === 'number' ? input.nowMs : Date.now();
    const tzOffsetMinutes = input.tzOffsetMinutes;
    if (Number.isNaN(tzOffsetMinutes))
        throw new Error('Invalid tzOffsetMinutes');
    const sessionDuration = Math.max(5, Math.floor(Number(input.sessionDurationMinutes || 60)));
    const minBookableAtMs = getMinBookableAtMs(input.therapistCreatedAt);
    const minBookableDateKey = formatDateKeyFromUtcMs(minBookableAtMs, tzOffsetMinutes);
    const bookedMinuteKeys = new Set((input.bookedSlotIsos || []).map(toMinuteKey));
    const start = parseDateKey(input.startDateKey);
    const end = parseDateKey(input.endDateKey);
    if (!start || !end)
        throw new Error('Invalid startDateKey/endDateKey');
    const startDayUtc = Date.UTC(start.y, start.m - 1, start.d, 0, 0, 0, 0);
    const endDayUtc = Date.UTC(end.y, end.m - 1, end.d, 0, 0, 0, 0);
    if (endDayUtc < startDayUtc)
        throw new Error('endDateKey is before startDateKey');
    const availableSlots = [];
    const availableDateKeysSet = new Set();
    // Iterate local calendar days by stepping in UTC day increments on the calendar date.
    for (let dayUtc = startDayUtc; dayUtc <= endDayUtc; dayUtc += MS_PER_DAY) {
        const day = new Date(dayUtc);
        const dateKey = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`;
        const dow = dateKeyToDayOfWeek(dateKey);
        const daySlots = input.weeklyAvailability.filter((a) => Number(a.dayOfWeek) === dow);
        if (daySlots.length === 0)
            continue;
        for (const window of daySlots) {
            const startMin = timeToMinutes(window.startTime);
            const endMin = timeToMinutes(window.endTime);
            if (startMin === null || endMin === null)
                continue;
            if (endMin <= startMin)
                continue;
            for (let slotMin = startMin; slotMin + sessionDuration <= endMin; slotMin += sessionDuration) {
                const slotUtcMs = localDateKeyTimeToUtcMs(dateKey, slotMin, tzOffsetMinutes);
                if (slotUtcMs <= nowMs)
                    continue;
                if (slotUtcMs < minBookableAtMs)
                    continue;
                const iso = new Date(slotUtcMs).toISOString();
                if (bookedMinuteKeys.has(toMinuteKey(iso)))
                    continue;
                availableSlots.push(iso);
                availableDateKeysSet.add(dateKey);
            }
        }
    }
    availableSlots.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const availableDateKeys = Array.from(availableDateKeysSet.values()).sort();
    return {
        availableSlots,
        availableDateKeys,
        minBookableDateKey,
        minBookableAtIso: new Date(minBookableAtMs).toISOString(),
    };
}
export function validateScheduledAtAgainstAvailability(input) {
    const nowMs = typeof input.nowMs === 'number' ? input.nowMs : Date.now();
    const scheduled = new Date(input.scheduledAtIso);
    if (Number.isNaN(scheduled.getTime())) {
        return { ok: false, reason: 'Invalid scheduledAt timestamp.' };
    }
    const tzOffsetMinutes = input.tzOffsetMinutes;
    if (Number.isNaN(tzOffsetMinutes))
        return { ok: false, reason: 'Invalid timezone offset.' };
    const therapistDuration = Math.max(5, Math.floor(Number(input.therapistSessionDurationMinutes || 60)));
    const requestedDuration = Math.max(5, Math.floor(Number(input.durationMinutes || 60)));
    if (requestedDuration !== therapistDuration) {
        return { ok: false, reason: `This therapist only offers ${therapistDuration}-minute sessions.` };
    }
    const minBookableAtMs = getMinBookableAtMs(input.therapistCreatedAt);
    if (scheduled.getTime() < minBookableAtMs) {
        const openKey = formatDateKeyFromUtcMs(minBookableAtMs, tzOffsetMinutes);
        return { ok: false, reason: `This therapist is new. Booking opens on ${openKey}.` };
    }
    if (scheduled.getTime() <= nowMs) {
        return { ok: false, reason: 'You can only book future time slots.' };
    }
    // Compute local calendar date/time for schedule matching.
    const localMs = scheduled.getTime() - tzOffsetMinutes * MS_PER_MIN;
    const local = new Date(localMs);
    const dateKey = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`;
    const dow = dateKeyToDayOfWeek(dateKey);
    const localMinutes = local.getUTCHours() * 60 + local.getUTCMinutes();
    const windows = input.weeklyAvailability.filter((a) => Number(a.dayOfWeek) === dow);
    if (windows.length === 0)
        return { ok: false, reason: 'That day is not within the therapist’s schedule.' };
    for (const w of windows) {
        const startMin = timeToMinutes(w.startTime);
        const endMin = timeToMinutes(w.endTime);
        if (startMin === null || endMin === null)
            continue;
        if (endMin <= startMin)
            continue;
        const within = localMinutes >= startMin && localMinutes + therapistDuration <= endMin;
        if (!within)
            continue;
        // Ensure it aligns to slot boundaries for the day.
        if ((localMinutes - startMin) % therapistDuration !== 0) {
            return { ok: false, reason: 'That time does not align with the therapist’s booking slots.' };
        }
        return { ok: true };
    }
    return { ok: false, reason: 'That time is not within the therapist’s schedule.' };
}
