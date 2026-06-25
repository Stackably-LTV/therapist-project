import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok } from '@/components/7ff049787825';
/**
 * List files shared between the current user and a partner, in both directions
 * (files I own + shared with them, and files they own + shared with me).
 */
export async function getSharedFiles(userId, withUserId) {
    const supabase = await createClient();
    // Files I own and shared with the other user.
    const { data: mine } = await supabase
        .from('file_uploads')
        .select('id, owner_id, file_name, mime_type, file_size_bytes, shared_with, created_at')
        .eq('owner_id', userId)
        .contains('shared_with', [withUserId])
        .order('created_at', { ascending: false })
        .limit(200);
    // Files the other user owns and shared with me. RLS allows me to SELECT
    // these because my id is in shared_with.
    const { data: theirs } = await supabase
        .from('file_uploads')
        .select('id, owner_id, file_name, mime_type, file_size_bytes, shared_with, created_at')
        .eq('owner_id', withUserId)
        .contains('shared_with', [userId])
        .order('created_at', { ascending: false })
        .limit(200);
    const rows = [...(mine ?? []), ...(theirs ?? [])];
    const files = rows
        .map((d) => ({
        id: d.id,
        ownerId: d.owner_id,
        fileName: d.file_name,
        mimeType: d.mime_type,
        fileSizeBytes: d.file_size_bytes,
        createdAt: d.created_at,
        direction: d.owner_id === userId ? 'outgoing' : 'incoming',
    }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return ok({ files });
}
