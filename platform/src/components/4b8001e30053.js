import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
/** List a therapist's calendar blocks overlapping the [start, end] window. */
export async function listCalendarBlocks(args) {
    const start = asOptionalString(args.start);
    const end = asOptionalString(args.end);
    if (!start || !end) {
        return fail(400, 'start and end query params are required');
    }
    const supabase = await createClient();
    const { data: blocks, error } = await supabase
        .from('calendar_blocks')
        .select('*')
        .eq('therapist_id', args.therapistId)
        .gte('end_at', new Date(start).toISOString())
        .lte('start_at', new Date(end).toISOString())
        .order('start_at', { ascending: true });
    if (error)
        return fail(500, error.message);
    return ok({ blocks: blocks ?? [] });
}
/** Create a new calendar block for a therapist. */
export async function createCalendarBlock(args) {
    const { therapistId, body } = args;
    const startAt = asOptionalString(body?.startAt);
    const endAt = asOptionalString(body?.endAt);
    if (!startAt || !endAt) {
        return fail(400, 'startAt and endAt are required');
    }
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return fail(400, 'startAt and endAt must be valid datetimes');
    }
    if (startDate.getTime() < Date.now()) {
        return fail(400, 'Cannot create calendar blocks in the past');
    }
    if (endDate <= startDate) {
        return fail(400, 'endAt must be after startAt');
    }
    const supabase = await createClient();
    const { data: block, error } = await supabase
        .from('calendar_blocks')
        .insert({
        therapist_id: therapistId,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        kind: asOptionalString(body?.kind) ?? 'unavailable',
        title: asOptionalString(body?.title),
        notes: asOptionalString(body?.notes),
    })
        .select('*')
        .single();
    if (error)
        return fail(500, error.message);
    return ok({ block });
}
/** Update an existing calendar block owned by the therapist. */
export async function updateCalendarBlock(args) {
    const { therapistId, blockId, body } = args;
    const update = {};
    const startAt = asOptionalString(body?.startAt);
    const endAt = asOptionalString(body?.endAt);
    const kind = asOptionalString(body?.kind);
    const title = asOptionalString(body?.title);
    const notes = asOptionalString(body?.notes);
    if (startAt)
        update.start_at = startAt;
    if (endAt)
        update.end_at = endAt;
    if (kind)
        update.kind = kind;
    if (title !== null)
        update.title = title;
    if (notes !== null)
        update.notes = notes;
    const supabase = await createClient();
    const { data: block, error } = await supabase
        .from('calendar_blocks')
        .update(update)
        .eq('id', blockId)
        .eq('therapist_id', therapistId)
        .select('*')
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!block)
        return fail(404, 'Not found');
    return ok({ block });
}
/** Delete a calendar block owned by the therapist. */
export async function deleteCalendarBlock(args) {
    const { therapistId, blockId } = args;
    const supabase = await createClient();
    const { error, count } = await supabase
        .from('calendar_blocks')
        .delete({ count: 'exact' })
        .eq('id', blockId)
        .eq('therapist_id', therapistId);
    if (error)
        return fail(500, error.message);
    if (!count)
        return fail(404, 'Not found');
    return ok({ success: true });
}
