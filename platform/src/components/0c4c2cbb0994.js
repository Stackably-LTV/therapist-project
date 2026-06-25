import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Fetch a non-private provider note the seeker is allowed to download.
 * Returns the note row; the handler shapes the file/attachment response.
 */
export async function getSeekerNoteForDownload(seekerId, noteId) {
    const supabase = await createClient();
    const { data: note, error } = await supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('id', noteId)
        .eq('seeker_id', seekerId)
        .eq('is_private', false)
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!note)
        return fail(404, 'Note not found');
    return ok({ note });
}
