import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { MAX_CHAT_ATTACHMENT_BYTES, isAllowedChatAttachment, } from '@/components/bc9ddfa866a2';
import { ok, fail } from '@/components/7ff049787825';
function asString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function isValidStoragePath(path, userId) {
    return path.startsWith(`${userId}/`) && !path.includes('..') && !path.includes('//');
}
async function hasTherapistSeekerRelationship(therapistId, seekerId, supabase) {
    // Check 1: primary therapist via patient_records
    const { data: record } = await supabase
        .from('patient_records')
        .select('primary_therapist_id')
        .eq('seeker_id', seekerId)
        .maybeSingle();
    if (record?.primary_therapist_id === therapistId)
        return true;
    // Check 2: any appointment together
    const { data: appt } = await supabase
        .from('appointments')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .limit(1)
        .maybeSingle();
    if (appt)
        return true;
    // Check 3: connection request in either direction, not declined
    const { data: conn } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .neq('status', 'declined')
        .limit(1)
        .maybeSingle();
    if (conn)
        return true;
    // Check 4: any prior message exchanged between the two. Free chat is the floor —
    // if you're already messaging, you can also send attachments.
    const { data: msg } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${therapistId},recipient_id.eq.${seekerId}),and(sender_id.eq.${seekerId},recipient_id.eq.${therapistId})`)
        .limit(1)
        .maybeSingle();
    return !!msg;
}
/**
 * Two-phase chat attachment flow. `init` validates the file + relationship and
 * returns a signed upload URL; `complete` records the uploaded file in
 * file_uploads (shared with the recipient). Returns 401 if the caller is not
 * a known user.
 */
export async function handleAttachment(userId, body) {
    const supabase = await createClient();
    const storageClient = createServiceRoleClient();
    const { data: senderRole } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
    if (!senderRole)
        return fail(401, 'Unauthorized');
    const action = asString(body?.action) || 'init';
    const recipientId = asString(body?.recipientId);
    const requestedType = asString(body?.requestedType);
    const requestId = asString(body?.requestId);
    const fileName = asString(body?.fileName);
    const mimeType = asString(body?.mimeType);
    const fileSize = Number(body?.fileSize);
    const storagePath = asString(body?.storagePath);
    if (!recipientId)
        return fail(400, 'recipientId is required');
    if (!fileName)
        return fail(400, 'fileName is required');
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
        return fail(400, 'fileSize is required');
    }
    if (fileSize > MAX_CHAT_ATTACHMENT_BYTES) {
        return fail(400, 'File size must be 50MB or less');
    }
    if (!isAllowedChatAttachment({ name: fileName, type: mimeType })) {
        return fail(400, 'Only PDF, Word, text, and image files are allowed');
    }
    const { data: recipientRole } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('id', recipientId)
        .maybeSingle();
    if (!recipientRole)
        return fail(404, 'Recipient not found');
    const isTherapistToSeeker = senderRole.role === 'therapist' && recipientRole.role === 'seeker';
    const isSeekerToTherapist = senderRole.role === 'seeker' && recipientRole.role === 'therapist';
    if (!isTherapistToSeeker && !isSeekerToTherapist) {
        return fail(403, 'Unsupported recipient role pair');
    }
    const therapistId = isTherapistToSeeker ? userId : recipientId;
    const seekerId = isTherapistToSeeker ? recipientId : userId;
    const canAccess = await hasTherapistSeekerRelationship(therapistId, seekerId, supabase);
    if (!canAccess)
        return fail(403, 'Forbidden');
    const bucketName = 'message-attachments';
    if (action === 'init') {
        const safeName = fileName.replace(/[^\w.\- ]+/g, '_').slice(0, 120);
        const filePath = `${userId}/${Date.now()}-${safeName || 'attachment'}`;
        const { data: signed, error: uploadError } = await storageClient.storage
            .from(bucketName)
            .createSignedUploadUrl(filePath);
        if (uploadError || !signed?.token) {
            console.warn(`[api/chat/attachments] signed upload failed on bucket=${bucketName}`, uploadError);
            return fail(500, uploadError?.message || 'Failed to prepare file upload');
        }
        return ok({
            upload: {
                bucket: bucketName,
                path: filePath,
                storagePath: `${bucketName}/${filePath}`,
                token: signed.token,
                fileName,
                mimeType,
                sizeBytes: fileSize,
            },
        });
    }
    if (action !== 'complete') {
        return fail(400, 'Unsupported attachment action');
    }
    if (!storagePath || !storagePath.startsWith(`${bucketName}/`)) {
        return fail(400, 'storagePath is required');
    }
    const filePath = storagePath.slice(`${bucketName}/`.length);
    if (!isValidStoragePath(filePath, userId)) {
        return fail(400, 'Invalid storage path');
    }
    const { data: document, error: docError } = await supabase
        .from('file_uploads')
        .insert({
        owner_id: userId,
        file_name: fileName,
        file_url: storagePath,
        file_size_bytes: fileSize,
        mime_type: mimeType,
        type: 'other',
        related_id: requestId || null,
        shared_with: [recipientId],
    })
        .select('*')
        .single();
    if (docError) {
        console.error('[api/chat/attachments] file_uploads insert failed', docError);
        return fail(500, 'Failed to save document record');
    }
    return {
        ok: true,
        status: 201,
        data: {
            document: {
                id: document.id,
                fileName: document.file_name,
                fileUrl: document.file_url,
                fileSizeBytes: document.file_size_bytes,
                mimeType: document.mime_type,
                ownerId: document.owner_id,
                sharedWith: document.shared_with,
                createdAt: document.created_at,
            },
            metadata: {
                requestedType: requestedType || null,
                requestId: requestId || null,
            },
        },
    };
}
