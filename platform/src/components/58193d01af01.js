import 'server-only';
/**
 * Shared request-body coercion helpers for treatment-plan services. Extracted
 * verbatim from the route handlers so behavior is identical: trim strings (empty
 * -> null), parse base-10 integers, and normalize date inputs to ISO `YYYY-MM-DD`.
 */
export function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
export function asOptionalNumber(v) {
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v !== 'string')
        return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
}
export function normalizeDateInput(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    if (!s)
        return null;
    const iso = s.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (iso)
        return iso;
    const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy)
        return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
    return null;
}
