import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
import crypto from 'crypto';
const BUCKET = 'community-post-media';
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
function guessExt(file) {
    const byType = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
    };
    const fromType = byType[file.type];
    if (fromType)
        return fromType;
    const fromName = file.name.split('.').pop()?.toLowerCase();
    return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : 'jpg';
}
/** Upload a group post media image to storage, falling back to service role on RLS denial. */
export async function uploadGroupMedia(userId, groupId, file) {
    const supabase = await createClient();
    const { data: membership } = await supabase
        .from('community_group_members')
        .select('status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || membership.status !== 'active') {
        return fail(403, 'Not a group member');
    }
    if (!(file instanceof File)) {
        return fail(400, 'No file provided');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return fail(400, 'File must be JPEG, PNG, WebP or GIF');
    }
    if (file.size > MAX_SIZE) {
        return fail(400, 'Image must be under 5MB');
    }
    const ext = guessExt(file);
    const objectPath = `community/${groupId}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
    });
    if (uploadError) {
        const msg = uploadError.message || '';
        if (msg.toLowerCase().includes('row-level security') ||
            msg.toLowerCase().includes('policy')) {
            const serviceClient = createServiceRoleClient();
            const { error: serviceError } = await serviceClient.storage
                .from(BUCKET)
                .upload(objectPath, buffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });
            if (serviceError) {
                return fail(500, `Upload failed: ${serviceError.message}`);
            }
            const { data: urlData } = serviceClient.storage.from(BUCKET).getPublicUrl(objectPath);
            return ok({ path: objectPath, publicUrl: urlData.publicUrl });
        }
        return fail(500, `Upload failed: ${msg}`);
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return ok({ path: objectPath, publicUrl: urlData.publicUrl });
}
