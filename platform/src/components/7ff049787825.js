/** Build a success result. */
export function ok(data) {
    return { ok: true, data };
}
/** Build a failure result with an HTTP status and message. */
export function fail(status, error) {
    return { ok: false, status, error };
}
