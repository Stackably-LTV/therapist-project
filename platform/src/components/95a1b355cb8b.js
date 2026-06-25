/** Coerce an unknown value to a trimmed non-empty string, else null. */
export function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
