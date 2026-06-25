import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
const BUCKET = 'treatment-plan-attachments';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
async function ensurePlanOwner(planId, therapistId) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id')
        .eq('id', planId)
        .maybeSingle();
    if (!data)
        return { ok: false, status: 404, error: 'Not found' };
    if (data.therapist_id !== therapistId)
        return { ok: false, status: 403, error: 'Forbidden' };
    return { ok: true, supabase };
}
/** List a plan's attachments with fresh signed download URLs. Owner-scoped. */
export async function listAttachments(therapistId, planId) {
    const owner = await ensurePlanOwner(planId, therapistId);
    if (!owner.ok)
        return fail(owner.status, owner.error);
    const { data: attachments } = await owner.supabase
        .from('treatment_plan_attachments')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });
    const storage = createServiceRoleClient();
    const withUrls = await Promise.all((attachments ?? []).map(async (a) => {
        const fileUrl = String(a.file_url || '');
        const path = fileUrl.replace(`${BUCKET}/`, '');
        const { data } = await storage.storage.from(BUCKET).createSignedUrl(path, 3600);
        return { ...a, signedUrl: data?.signedUrl ?? null };
    }));
    return ok({ attachments: withUrls });
}
/** Upload a file to storage and record an attachment row. Owner-scoped. */
export async function createAttachment(therapistId, planId, file) {
    const owner = await ensurePlanOwner(planId, therapistId);
    if (!owner.ok)
        return fail(owner.status, owner.error);
    if (!file)
        return fail(400, 'file is required');
    if (file.size > MAX_BYTES)
        return fail(400, 'File size must be 10 MB or less');
    if (!ALLOWED_TYPES.includes(file.type)) {
        return fail(400, 'Only PDF and image files are allowed');
    }
    const safeName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120);
    const filePath = `${planId}/${Date.now()}-${safeName}`;
    const storage = createServiceRoleClient();
    const { error: uploadError } = await storage.storage.from(BUCKET).upload(filePath, file, {
        contentType: file.type || undefined,
        upsert: false,
    });
    if (uploadError) {
        return fail(500, uploadError.message || 'Upload failed');
    }
    const { data: attachment, error } = await owner.supabase
        .from('treatment_plan_attachments')
        .insert({
        plan_id: planId,
        file_name: file.name,
        file_url: `${BUCKET}/${filePath}`,
        file_size_bytes: file.size,
        mime_type: file.type,
        uploaded_by: therapistId,
    })
        .select('*')
        .single();
    if (error)
        return fail(500, error.message);
    return ok({ attachment });
}
/** Remove an attachment from storage and delete its row. Owner-scoped. */
export async function deleteAttachment(therapistId, planId, attachmentId) {
    const supabase = await createClient();
    const { data: plan } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id')
        .eq('id', planId)
        .maybeSingle();
    if (!plan)
        return fail(404, 'Not found');
    if (plan.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    const { data: attachment } = await supabase
        .from('treatment_plan_attachments')
        .select('*')
        .eq('id', attachmentId)
        .maybeSingle();
    if (!attachment || attachment.plan_id !== planId) {
        return fail(404, 'Attachment not found');
    }
    const storagePath = String(attachment.file_url || '').replace(`${BUCKET}/`, '');
    const storage = createServiceRoleClient();
    await storage.storage.from(BUCKET).remove([storagePath]);
    await supabase.from('treatment_plan_attachments').delete().eq('id', attachmentId);
    return ok({ ok: true });
}
