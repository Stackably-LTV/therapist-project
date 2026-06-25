import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
import { coursePublishingService } from '@/components/3b4f71ce25be';
const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024;
const THUMBNAIL_BUCKET = 'course-media';
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const WELCOME_MAX_BYTES = 100 * 1024 * 1024; // 100MB
function sanitizeFileName(name) {
    return name.replaceAll('\\', '-').replaceAll('/', '-').replaceAll('..', '.');
}
function isSafeStoragePath(path) {
    if (!path)
        return false;
    if (path.includes('..'))
        return false;
    if (path.startsWith('/'))
        return false;
    return true;
}
function parseStoragePath(rawPath) {
    const normalized = (rawPath || '').trim();
    if (!normalized)
        return null;
    const parts = normalized.split('/');
    const bucket = parts.length > 1 ? parts[0] : THUMBNAIL_BUCKET;
    const objectPath = parts.length > 1 ? parts.slice(1).join('/') : normalized;
    if (bucket !== THUMBNAIL_BUCKET || !isSafeStoragePath(objectPath))
        return null;
    return { bucket, objectPath };
}
/** Therapist's own courses, newest first. */
export async function listTherapistCourses(userId) {
    const supabase = await createClient();
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('therapist_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('[api/therapist/courses] GET error', error);
        return fail(500, 'Failed to load courses');
    }
    return ok({ courses: courses ?? [] });
}
/** Create a new draft course. */
export async function createCourse(userId, body) {
    const title = String(body?.title || '').trim();
    const description = typeof body?.description === 'string' ? body.description.trim() : null;
    if (!title)
        return fail(400, 'Title is required');
    const supabase = await createClient();
    const { data: course, error } = await supabase
        .from('courses')
        .insert({
        therapist_id: userId,
        title,
        description,
        price_cents: 0,
        currency: 'usd',
        is_published: false,
        thumbnail_path: null,
    })
        .select('*')
        .single();
    if (error) {
        console.error('[api/therapist/courses] POST error', error);
        return fail(500, 'Failed to create course');
    }
    return ok({ course });
}
/** Delete all of a therapist's courses. */
export async function deleteAllCourses(userId) {
    const supabase = await createClient();
    const { data: deletedRows, error } = await supabase
        .from('courses')
        .delete()
        .eq('therapist_id', userId)
        .select('id');
    if (error) {
        return fail(400, error.message);
    }
    return ok({
        ok: true,
        deletedCount: deletedRows?.length ?? 0,
        deletedIds: (deletedRows ?? []).map((r) => r.id),
    });
}
/** Update a course owned by the therapist. */
export async function updateCourse(courseId, userId, body) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    const patch = {};
    if (typeof body?.title === 'string')
        patch.title = body.title.trim();
    if (body?.description === null || typeof body?.description === 'string') {
        patch.description = body.description === null ? null : body.description.trim();
    }
    if (body?.thumbnailPath === null || typeof body?.thumbnailPath === 'string') {
        patch.thumbnail_path = body.thumbnailPath === null ? null : body.thumbnailPath.trim();
    }
    const { data: updated, error } = await supabase
        .from('courses')
        .update(patch)
        .eq('id', courseId)
        .select('*')
        .single();
    if (error) {
        console.error('[api/therapist/courses/[courseId]] PATCH error', error);
        return fail(500, 'Failed to update course');
    }
    return ok({ course: updated });
}
/** Delete a single course owned by the therapist. */
export async function deleteCourse(courseId, userId) {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('therapist_id', userId)
        .select('id')
        .single();
    if (error) {
        return fail(400, error.message);
    }
    if (!deleted?.id) {
        return fail(404, 'Course not found');
    }
    return ok({ ok: true, deletedId: deleted.id });
}
/** Toggle a course's publish state, cascading to modules/lessons. */
export async function setCoursePublishState(courseId, userId, body) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id, is_published')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    const shouldPublish = typeof body?.isPublished === 'boolean' ? body.isPublished : !course.is_published;
    const publishResult = shouldPublish
        ? await coursePublishingService.publishCourse(courseId)
        : await coursePublishingService.unpublishCourse(courseId);
    if (!publishResult.success) {
        return fail(500, publishResult.error || 'Failed to update course publish status');
    }
    const { data: updated } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
    return ok({
        course: updated,
        publishResult: {
            isPublished: shouldPublish,
            modulesUpdated: publishResult.modulesUpdated || 0,
            lessonsUpdated: publishResult.lessonsUpdated || 0,
            blocksUpdated: publishResult.blocksUpdated || 0,
        },
    });
}
async function getTherapistCourseThumbnail(courseId, userId) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id, thumbnail_path')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId)
        return null;
    return course;
}
/** Resolve a signed URL for the course thumbnail. */
export async function getCourseThumbnailSignedUrl(courseId, userId) {
    const course = await getTherapistCourseThumbnail(courseId, userId);
    if (!course)
        return fail(404, 'Course not found');
    const stored = parseStoragePath(course.thumbnail_path);
    if (!stored)
        return fail(404, 'No featured image');
    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient.storage
        .from(stored.bucket)
        .createSignedUrl(stored.objectPath, 60 * 30);
    if (error || !data?.signedUrl) {
        console.error('[course thumbnail] createSignedUrl error', error);
        return fail(500, 'Failed to create signed URL');
    }
    return ok({ signedUrl: data.signedUrl });
}
/** Upload and persist a course thumbnail. */
export async function uploadCourseThumbnail(courseId, userId, file) {
    const course = await getTherapistCourseThumbnail(courseId, userId);
    if (!course)
        return fail(404, 'Course not found');
    if (!file)
        return fail(400, 'No file provided');
    const rawType = (file.type || '').toLowerCase().trim();
    const contentType = rawType === 'image/jpg' ? 'image/jpeg' : rawType;
    if (!contentType.startsWith('image/')) {
        return fail(400, 'File must be an image');
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) {
        return fail(400, `Unsupported image type: ${contentType || 'unknown'}`);
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
        return fail(400, 'Image must be <= 10MB');
    }
    const safeName = sanitizeFileName(file.name || 'featured');
    const objectPath = `courses/${courseId}/featured/${Date.now()}-${safeName}`;
    const serviceClient = createServiceRoleClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { error: uploadError } = await serviceClient.storage
        .from(THUMBNAIL_BUCKET)
        .upload(objectPath, buffer, { contentType, upsert: false });
    if (uploadError) {
        console.error('[course thumbnail] upload error', uploadError);
        return fail(500, 'Failed to upload featured image');
    }
    const previous = parseStoragePath(course.thumbnail_path);
    if (previous) {
        const { error: removeError } = await serviceClient.storage
            .from(previous.bucket)
            .remove([previous.objectPath]);
        if (removeError)
            console.warn('[course thumbnail] remove previous error', removeError);
    }
    const supabase = await createClient();
    const { data: updated, error: updateErr } = await supabase
        .from('courses')
        .update({ thumbnail_path: `${THUMBNAIL_BUCKET}/${objectPath}` })
        .eq('id', courseId)
        .select('thumbnail_path')
        .single();
    if (updateErr) {
        console.error('[course thumbnail] update error', updateErr);
        return fail(500, 'Failed to save featured image');
    }
    return ok({ thumbnailPath: updated?.thumbnail_path ?? null });
}
/** Remove a course thumbnail. */
export async function deleteCourseThumbnail(courseId, userId) {
    const course = await getTherapistCourseThumbnail(courseId, userId);
    if (!course)
        return fail(404, 'Course not found');
    const stored = parseStoragePath(course.thumbnail_path);
    if (stored) {
        const serviceClient = createServiceRoleClient();
        const { error: removeError } = await serviceClient.storage
            .from(stored.bucket)
            .remove([stored.objectPath]);
        if (removeError)
            console.warn('[course thumbnail] remove error', removeError);
    }
    const supabase = await createClient();
    const { error } = await supabase
        .from('courses')
        .update({ thumbnail_path: null })
        .eq('id', courseId);
    if (error) {
        console.error('[course thumbnail] clear error', error);
        return fail(500, 'Failed to clear featured image');
    }
    return ok({ ok: true });
}
/** Upload a welcome doc and attach it as a starter module/lesson block. */
export async function uploadWelcomeDoc(courseId, userId, file) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id, thumbnail_path')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    if (!file)
        return fail(400, 'file is required');
    if (file.size > WELCOME_MAX_BYTES) {
        return fail(400, 'File size must be 100MB or less');
    }
    const bucket = 'course-media';
    const safeName = sanitizeFileName(file.name || 'welcome');
    const objectPath = `courses/${courseId}/welcome/${Date.now()}-${safeName}`;
    const serviceClient = createServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
        .from(bucket)
        .upload(objectPath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
        console.error('[course welcome-doc] upload error', uploadError);
        return fail(500, 'Failed to upload file');
    }
    const isImage = (file.type || '').startsWith('image/');
    if (isImage && !course.thumbnail_path) {
        await supabase
            .from('courses')
            .update({ thumbnail_path: `${bucket}/${objectPath}` })
            .eq('id', courseId);
    }
    const { data: existingModule } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
    let moduleId = existingModule?.id;
    if (!moduleId) {
        const { data: createdModule, error: moduleError } = await supabase
            .from('course_modules')
            .insert({ course_id: courseId, title: 'Welcome', position: 0, status: 'draft' })
            .select('id')
            .single();
        if (moduleError || !createdModule) {
            console.error('[course welcome-doc] module create error', moduleError);
            return fail(500, 'Failed to create welcome module');
        }
        moduleId = createdModule.id;
    }
    const { data: existingLesson } = await supabase
        .from('course_lessons')
        .select('id, content_blocks_json')
        .eq('module_id', moduleId)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
    let lessonId;
    let currentBlocks = [];
    if (existingLesson?.id) {
        lessonId = existingLesson.id;
        currentBlocks = Array.isArray(existingLesson.content_blocks_json)
            ? existingLesson.content_blocks_json
            : [];
    }
    else {
        const { data: createdLesson, error: lessonError } = await supabase
            .from('course_lessons')
            .insert({
            module_id: moduleId,
            title: 'Resources',
            position: 0,
            status: 'draft',
            is_preview: false,
            content_blocks_json: [],
        })
            .select('id')
            .single();
        if (lessonError || !createdLesson) {
            console.error('[course welcome-doc] lesson create error', lessonError);
            return fail(500, 'Failed to create welcome lesson');
        }
        lessonId = createdLesson.id;
    }
    const block = {
        id: crypto.randomUUID(),
        type: isImage ? 'image' : 'file',
        position: currentBlocks.length,
        status: 'draft',
        payload: {
            bucket,
            path: objectPath,
            storagePath: `${bucket}/${objectPath}`,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            ...(isImage ? { url: `${bucket}/${objectPath}`, alt: file.name } : {}),
        },
    };
    const { error: updateError } = await supabase
        .from('course_lessons')
        .update({ content_blocks_json: [...currentBlocks, block] })
        .eq('id', lessonId);
    if (updateError) {
        console.error('[course welcome-doc] block append error', updateError);
        return fail(500, 'Failed to attach uploaded file to lesson');
    }
    return ok({
        success: true,
        moduleId,
        lessonId,
        blockId: block.id,
        asset: {
            bucket,
            path: objectPath,
            storagePath: `${bucket}/${objectPath}`,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
        },
    });
}
/** Create a module under a course owned by the therapist. */
export async function createModule(courseId, userId, body) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    const title = String(body?.title || '').trim();
    if (!title)
        return fail(400, 'Title is required');
    const { data: existing } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);
    const position = typeof body?.position === 'number' && Number.isFinite(body.position)
        ? Math.max(0, Math.round(body.position))
        : (existing?.length ?? 0);
    const { data: module, error } = await supabase
        .from('course_modules')
        .insert({ course_id: courseId, title, position })
        .select('*')
        .single();
    if (error) {
        console.error('[course modules] create error', error);
        return fail(500, 'Failed to create module');
    }
    return ok({ module });
}
/** Update a module belonging to the given course. */
export async function updateModule(courseId, moduleId, body) {
    const supabase = await createClient();
    const { data: modRow, error: modErr } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .eq('id', moduleId)
        .maybeSingle();
    if (modErr || !modRow || modRow.course_id !== courseId) {
        return fail(404, 'Module not found');
    }
    const patch = {};
    if (body?.title !== undefined)
        patch.title = String(body.title).trim();
    if (body?.position !== undefined) {
        if (typeof body.position !== 'number' || !Number.isFinite(body.position)) {
            return fail(400, 'position must be a number');
        }
        patch.position = Math.max(0, Math.round(body.position));
    }
    if (body?.status !== undefined) {
        if (!isStatus(body.status))
            return fail(400, 'Invalid status');
        patch.status = body.status;
        patch.published_at = body.status === 'published' ? new Date().toISOString() : null;
    }
    const { data, error } = await supabase
        .from('course_modules')
        .update(patch)
        .eq('id', moduleId)
        .select('*')
        .single();
    if (error) {
        console.error('[course modules] update error', error);
        return fail(500, 'Failed to update module');
    }
    return ok({ module: data });
}
/** Create a lesson under a module of a course owned by the therapist. */
export async function createLesson(courseId, userId, body) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    const moduleId = String(body?.moduleId || '').trim();
    const title = String(body?.title || '').trim();
    const isPreview = !!body?.isPreview;
    if (!moduleId)
        return fail(400, 'moduleId is required');
    if (!title)
        return fail(400, 'Title is required');
    const { data: module } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .eq('id', moduleId)
        .maybeSingle();
    if (!module || module.course_id !== courseId) {
        return fail(404, 'Module not found');
    }
    const { data: existing } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('module_id', moduleId);
    const position = typeof body?.position === 'number' && Number.isFinite(body.position)
        ? Math.max(0, Math.round(body.position))
        : (existing?.length ?? 0);
    const { data: lesson, error } = await supabase
        .from('course_lessons')
        .insert({
        module_id: moduleId,
        title,
        position,
        is_preview: isPreview,
        video_path: '',
        duration_seconds: null,
        content_blocks_json: [],
    })
        .select('*')
        .single();
    if (error) {
        console.error('[course lessons] create error', error);
        return fail(500, 'Failed to create lesson');
    }
    return ok({ lesson });
}
/** Update a lesson belonging to the given course. */
export async function updateLesson(courseId, lessonId, body) {
    const supabase = await createClient();
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
    const patch = {};
    if (body?.title !== undefined)
        patch.title = String(body.title).trim();
    if (body?.isPreview !== undefined)
        patch.is_preview = !!body.isPreview;
    if (body?.position !== undefined) {
        if (typeof body.position !== 'number' || !Number.isFinite(body.position)) {
            return fail(400, 'position must be a number');
        }
        patch.position = Math.max(0, Math.round(body.position));
    }
    if (body?.status !== undefined) {
        if (!isStatus(body.status))
            return fail(400, 'Invalid status');
        patch.status = body.status;
        patch.published_at = body.status === 'published' ? new Date().toISOString() : null;
    }
    const { data, error } = await supabase
        .from('course_lessons')
        .update(patch)
        .eq('id', lessonId)
        .select('*')
        .single();
    if (error) {
        console.error('[course lessons] update error', error);
        return fail(500, 'Failed to update lesson');
    }
    return ok({ lesson: data });
}
/** List seeker assignments for a course owned by the therapist. */
export async function listAssignments(courseId, userId) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    const { data: assignments, error } = await supabase
        .from('course_assignments')
        .select(`
        id,
        course_id,
        therapist_id,
        seeker_id,
        status,
        assigned_at,
        completed_at,
        seeker:user_profiles!course_assignments_seeker_id_fkey(user_id, full_name)
      `)
        .eq('course_id', courseId)
        .order('assigned_at', { ascending: false });
    if (error) {
        console.error('[course assignments] list error', error);
        return fail(500, 'Failed to load assignments');
    }
    return ok({ assignments: assignments ?? [] });
}
/** Assign a course to a seeker. */
export async function createAssignment(courseId, userId, body) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    const seekerId = String(body?.seekerId ?? body?.clientId ?? '').trim();
    if (!seekerId)
        return fail(400, 'seekerId is required');
    const { data: assignment, error } = await supabase
        .from('course_assignments')
        .insert({ course_id: courseId, therapist_id: userId, seeker_id: seekerId })
        .select('*')
        .single();
    if (error) {
        if (error.code === '23505') {
            return fail(409, 'Course is already assigned to that seeker');
        }
        console.error('[course assignments] create error', error);
        return fail(500, 'Failed to assign course');
    }
    return ok({ assignment });
}
/** Remove a course assignment. */
export async function deleteAssignment(courseId, assignmentId, userId) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || course.therapist_id !== userId) {
        return fail(404, 'Course not found');
    }
    const { data: assignment } = await supabase
        .from('course_assignments')
        .select('id, course_id')
        .eq('id', assignmentId)
        .maybeSingle();
    if (!assignment || assignment.course_id !== courseId) {
        return fail(404, 'Assignment not found');
    }
    const { error } = await supabase.from('course_assignments').delete().eq('id', assignmentId);
    if (error) {
        console.error('[course assignments] delete error', error);
        return fail(500, 'Failed to remove assignment');
    }
    return ok({ ok: true });
}
function isStatus(v) {
    return v === 'draft' || v === 'published' || v === 'archived';
}
