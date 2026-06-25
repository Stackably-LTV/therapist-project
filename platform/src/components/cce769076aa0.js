import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Upload a profile image for the current user. Falls back to a service-role client
 * if the user-scoped upload trips a row-level-security policy.
 */
export async function uploadProfileImage(userId, file) {
    if (!file) {
        return fail(400, 'No file provided');
    }
    if (!file.type.startsWith('image/')) {
        return fail(400, 'File must be an image');
    }
    const supabase = await createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
    });
    if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('new row violates row-level security')) {
            const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
            const { error: serviceUploadError } = await serviceClient.storage
                .from('profile-images')
                .upload(fileName, buffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
            });
            if (serviceUploadError) {
                return fail(500, `Failed to upload image: ${serviceUploadError.message}`);
            }
            const { data: urlData } = serviceClient.storage
                .from('profile-images')
                .getPublicUrl(fileName);
            return ok({ path: fileName, url: urlData.publicUrl });
        }
        return fail(500, `Failed to upload image: ${uploadError.message}`);
    }
    const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
    return ok({ path: fileName, url: urlData.publicUrl });
}
