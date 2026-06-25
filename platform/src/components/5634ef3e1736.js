import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { logAuditEvent } from '@/components/0be57ea0c568';
import { ok, fail } from '@/components/7ff049787825';
function isSafeStoragePath(path) {
    if (!path)
        return false;
    if (path.includes('..'))
        return false;
    if (path.startsWith('/'))
        return false;
    return true;
}
/**
 * Generate a short-lived signed URL for an admin to view a therapist's credential
 * file, validating the path and writing an audit log of the access.
 */
export async function createCredentialSignedUrl(adminUserId, rawPath, meta) {
    const path = rawPath?.trim() || '';
    if (!isSafeStoragePath(path)) {
        return fail(400, 'Invalid path');
    }
    const serviceClient = createServiceRoleClient();
    // Look up the file_uploads row for this path
    let fileUploadId = null;
    try {
        const { data: fileUpload } = await serviceClient
            .from('file_uploads')
            .select('id')
            .eq('file_url', path)
            .maybeSingle();
        fileUploadId = fileUpload?.id ?? null;
    }
    catch (e) {
        console.error('[AdminCredentialsSignedUrl] file_uploads lookup error', e);
    }
    const { data, error } = await serviceClient.storage
        .from('credentials')
        .createSignedUrl(path, 60); // 60-second TTL — long enough for click-through, short enough to not be shareable
    if (error || !data?.signedUrl) {
        console.error('[AdminCredentialsSignedUrl] createSignedUrl error', error);
        return fail(500, 'Failed to create signed URL');
    }
    // Audit log the credential access
    await logAuditEvent({
        userId: adminUserId,
        action: 'credential.view',
        tableName: 'file_uploads',
        recordId: fileUploadId,
        newData: { path, signed_url_generated_at: new Date().toISOString() },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
    });
    return ok({ signedUrl: data.signedUrl });
}
