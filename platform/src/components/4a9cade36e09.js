import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
const ALLOWED_CREDENTIAL_KINDS = ['license', 'resume', 'degree', 'certification', 'additional'];
/**
 * Upload therapist credential files to storage and record them in file_uploads
 * (via service-role to bypass self-insert RLS). Returns per-file warnings so the
 * handler can emit a 207 Multi-Status when some files succeed and others fail.
 */
export async function uploadCredentials(userId, files, kinds) {
    const supabase = await createClient();
    const { data: userRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
    if (!userRow) {
        return fail(404, 'User profile not found');
    }
    if (userRow.role !== 'therapist') {
        return fail(403, 'Only therapists can upload credentials');
    }
    if (!files || files.length === 0) {
        return fail(400, 'No files provided');
    }
    const uploadedPaths = [];
    const dbInsertErrors = [];
    const errors = [];
    // Use service-role client for DB inserts (RLS may block user inserts for themselves)
    const serviceClient = createServiceRoleClient();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const kind = kinds[i] || 'additional';
        const credentialKind = ALLOWED_CREDENTIAL_KINDS.includes(kind) ? kind : 'additional';
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push(`${file.name}: File size exceeds 10MB limit`);
            continue;
        }
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            errors.push(`${file.name}: Invalid file type. Only PDF, JPG, and PNG are allowed.`);
            continue;
        }
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            // Upload to storage with user client
            const { error: uploadError } = await supabase.storage
                .from('credentials')
                .upload(fileName, buffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });
            if (uploadError) {
                console.error('Upload error:', uploadError);
                errors.push(`${file.name}: ${uploadError.message}`);
                continue;
            }
            // Insert file_uploads record with service-role client
            const { error: dbError } = await serviceClient
                .from('file_uploads')
                .insert({
                owner_id: userId,
                type: 'credential',
                credential_kind: credentialKind,
                file_name: file.name,
                file_url: fileName,
                file_size_bytes: file.size,
                mime_type: file.type,
            });
            if (dbError) {
                console.error('Database insert error:', dbError);
                dbInsertErrors.push(`${file.name}: Failed to record in database. File uploaded but not tracked.`);
                // Still add to paths since the storage object exists
                uploadedPaths.push(fileName);
                continue;
            }
            uploadedPaths.push(fileName);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            errors.push(`${file.name}: ${errorMessage}`);
            console.error(`Error uploading ${file.name}:`, err);
        }
    }
    // If some files failed but others succeeded, return partial success
    if (errors.length > 0 && uploadedPaths.length === 0) {
        return fail(400, `Upload failed: ${errors.join('; ')}`);
    }
    // Combine all warnings
    const allWarnings = [...errors, ...dbInsertErrors];
    return ok({ paths: uploadedPaths, warnings: allWarnings });
}
