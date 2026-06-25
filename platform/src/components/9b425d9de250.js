import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { ok, fail } from '@/components/7ff049787825';
const BUCKET = 'community-covers';
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
/**
 * Upload a community cover image. Therapist-only; falls back to a service-role
 * client when the user-scoped upload hits an RLS policy.
 */
export async function uploadCommunityCover(userId, file) {
    const supabase = await createClient();
    const { data: userRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
    if (!userRow || userRow.role !== 'therapist') {
        return fail(403, 'Forbidden');
    }
    if (!file) {
        return fail(400, 'No file provided');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return fail(400, 'File must be JPEG, PNG, WebP or GIF');
    }
    if (file.size > MAX_SIZE) {
        return fail(400, 'Image must be under 5MB');
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
    });
    if (uploadError) {
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
            const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
            const { error: serviceError } = await serviceClient.storage
                .from(BUCKET)
                .upload(fileName, buffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
            });
            if (serviceError) {
                return fail(500, `Upload failed: ${serviceError.message}`);
            }
            const { data: urlData } = serviceClient.storage.from(BUCKET).getPublicUrl(fileName);
            return ok({ path: fileName, url: urlData.publicUrl });
        }
        return fail(500, `Upload failed: ${uploadError.message}`);
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return ok({ path: fileName, url: urlData.publicUrl });
}
