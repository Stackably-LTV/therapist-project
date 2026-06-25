import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
function sanitizeFileName(name) {
    return name.replaceAll('\\', '-').replaceAll('/', '-').replaceAll('..', '.');
}
function asString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
/** Verify a lesson belongs to a course owned by the therapist. */
async function verifyLessonOwnership(supabase, courseId, lessonId, userId) {
    const { data: lesson } = await supabase
        .from('course_lessons')
        .select('id, module_id')
        .eq('id', lessonId)
        .maybeSingle();
    if (!lesson)
        return fail(404, 'Lesson not found');
    const { data: mod } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .eq('id', lesson.module_id)
        .maybeSingle();
    if (!mod || mod.course_id !== courseId) {
        return fail(404, 'Lesson not found');
    }
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(403, 'Forbidden');
    }
    return ok(null);
}
/** Create a signed upload URL for a lesson asset. */
export async function createLessonAssetUpload(courseId, lessonId, userId, body) {
    const supabase = await createClient();
    const owner = await verifyLessonOwnership(supabase, courseId, lessonId, userId);
    if (!owner.ok)
        return owner;
    const fileName = asString(body?.fileName) || 'asset';
    const mimeType = asString(body?.mimeType) || 'application/octet-stream';
    const fileSize = Number(body?.fileSize);
    const maxBytes = 100 * 1024 * 1024; // 100MB
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
        return fail(400, 'fileSize is required');
    }
    if (fileSize > maxBytes)
        return fail(400, 'File size must be <= 100MB');
    const bucket = 'course-media';
    const safeName = sanitizeFileName(fileName);
    const objectPath = `courses/${courseId}/${lessonId}/assets/${Date.now()}-${safeName}`;
    const serviceClient = createServiceRoleClient();
    const { data: signed, error: uploadError } = await serviceClient.storage
        .from(bucket)
        .createSignedUploadUrl(objectPath);
    if (uploadError || !signed?.token) {
        console.error('[course upload-asset] signed upload error', uploadError);
        return fail(500, 'Failed to prepare asset upload');
    }
    return ok({
        upload: {
            bucket,
            path: objectPath,
            storagePath: `${bucket}/${objectPath}`,
            token: signed.token,
            fileName,
            mimeType,
            sizeBytes: fileSize,
        },
    });
}
/** Create a signed upload URL for a lesson video. */
export async function createLessonVideoUpload(courseId, lessonId, userId, body) {
    const supabase = await createClient();
    const owner = await verifyLessonOwnership(supabase, courseId, lessonId, userId);
    if (!owner.ok)
        return owner;
    const fileName = asString(body?.fileName) || 'video';
    const mimeType = asString(body?.mimeType) || 'application/octet-stream';
    const fileSize = Number(body?.fileSize);
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
        return fail(400, 'fileSize is required');
    }
    if (fileSize > 1024 * 1024 * 1024) {
        return fail(400, 'File size must be <= 1GB');
    }
    const bucket = 'course-media';
    const safeName = sanitizeFileName(fileName);
    const objectPath = `courses/${courseId}/${lessonId}/${Date.now()}-${safeName}`;
    const serviceClient = createServiceRoleClient();
    const { data: signed, error: uploadError } = await serviceClient.storage
        .from(bucket)
        .createSignedUploadUrl(objectPath);
    if (uploadError || !signed?.token) {
        console.error('[course upload-video] signed upload error', uploadError);
        return fail(500, 'Failed to prepare video upload');
    }
    return ok({
        upload: {
            bucket,
            path: objectPath,
            storagePath: `${bucket}/${objectPath}`,
            token: signed.token,
            fileName,
            mimeType,
            sizeBytes: fileSize,
        },
    });
}
/** Persist an uploaded video path onto the lesson. */
export async function saveLessonVideoPath(courseId, lessonId, userId, body) {
    const supabase = await createClient();
    const storagePath = asString(body?.storagePath);
    const expectedPrefix = `course-media/courses/${courseId}/${lessonId}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
        return fail(400, 'Invalid video path');
    }
    const owner = await verifyLessonOwnership(supabase, courseId, lessonId, userId);
    if (!owner.ok)
        return owner;
    const { data: updated, error: updateErr } = await supabase
        .from('course_lessons')
        .update({ video_path: storagePath })
        .eq('id', lessonId)
        .select('*')
        .single();
    if (updateErr) {
        console.error('[course upload-video] update error', updateErr);
        return fail(500, 'Failed to save video path');
    }
    return ok({ lesson: updated });
}
