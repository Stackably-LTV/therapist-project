import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Resolve a downloadable document for the current user. Enforces owner/shared
 * access, then either returns a redirect (external URL or short-lived signed URL)
 * or the raw bytes for an inline preview. Throws on unexpected DB errors so the
 * handler's catch can return a 500 (matching the original behaviour).
 */
export async function resolveDocumentDownload(userId, documentId, inline) {
    const supabase = await createClient();
    const storageClient = createServiceRoleClient();
    const { data: document, error: findError } = await supabase
        .from('file_uploads')
        .select('id, owner_id, shared_with, file_url, file_name, mime_type')
        .eq('id', documentId)
        .maybeSingle();
    if (findError)
        throw findError;
    if (!document) {
        return fail(404, 'Document not found');
    }
    const sharedWith = document.shared_with ?? [];
    const hasAccess = document.owner_id === userId || sharedWith.includes(userId);
    if (!hasAccess) {
        return fail(403, 'Access denied');
    }
    if (document.file_url.startsWith('http')) {
        return ok({ kind: 'redirect', url: document.file_url });
    }
    const parts = document.file_url.split('/');
    if (parts.length < 2) {
        return fail(400, 'Invalid file URL');
    }
    const bucket = parts[0];
    const path = parts.slice(1).join('/');
    if (inline) {
        const { data: fileData, error: downloadError } = await storageClient.storage
            .from(bucket)
            .download(path);
        if (downloadError || !fileData) {
            console.error('Error downloading file for inline preview:', downloadError);
            return fail(500, 'Failed to load preview');
        }
        const bytes = await fileData.arrayBuffer();
        return ok({
            kind: 'inline',
            bytes,
            contentType: document.mime_type || fileData.type || 'application/octet-stream',
            fileName: document.file_name || 'file',
        });
    }
    const { data: signedUrlData, error: signedUrlError } = await storageClient.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
    if (signedUrlError || !signedUrlData) {
        console.error('Error creating signed URL:', signedUrlError);
        return fail(500, 'Failed to generate download link');
    }
    return ok({ kind: 'redirect', url: signedUrlData.signedUrl });
}
