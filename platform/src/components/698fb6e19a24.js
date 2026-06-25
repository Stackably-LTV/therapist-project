import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
function isBlockType(v) {
    return v === 'markdown' || v === 'video' || v === 'file' || v === 'image' || v === 'assessment';
}
function isStatus(v) {
    return v === 'draft' || v === 'published' || v === 'archived';
}
async function loadLessonForCourse(supabase, courseId, lessonId, userId) {
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id')
        .eq('id', courseId)
        .maybeSingle();
    if (!course)
        return fail(404, 'Course not found');
    if (course.therapist_id !== userId) {
        return fail(403, 'Forbidden');
    }
    const { data: lesson } = await supabase
        .from('course_lessons')
        .select('id, module_id, content_blocks_json')
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
    const blocks = Array.isArray(lesson.content_blocks_json)
        ? lesson.content_blocks_json
        : [];
    return ok({ blocks });
}
/** List a lesson's content blocks (sorted by position). */
export async function listBlocks(courseId, lessonId, userId) {
    const supabase = await createClient();
    const result = await loadLessonForCourse(supabase, courseId, lessonId, userId);
    if (!result.ok)
        return result;
    const sorted = [...result.data.blocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return ok({ blocks: sorted });
}
/** Append a new content block to a lesson. */
export async function createBlock(courseId, lessonId, userId, body) {
    const supabase = await createClient();
    const result = await loadLessonForCourse(supabase, courseId, lessonId, userId);
    if (!result.ok)
        return result;
    const type = body?.type;
    const payload = body?.payload;
    const positionRaw = body?.position;
    const status = body?.status;
    if (!isBlockType(type))
        return fail(400, 'Invalid block type');
    if (payload !== undefined && (payload === null || typeof payload !== 'object' || Array.isArray(payload))) {
        return fail(400, 'payload must be an object');
    }
    const block = {
        id: crypto.randomUUID(),
        type,
        payload: (payload ?? {}),
        position: typeof positionRaw === 'number' && Number.isFinite(positionRaw)
            ? Math.max(0, Math.round(positionRaw))
            : result.data.blocks.length,
        ...(isStatus(status) ? { status } : {}),
        ...(isStatus(status) && status === 'published' ? { published_at: new Date().toISOString() } : {}),
    };
    const next = [...result.data.blocks, block];
    const { error } = await supabase
        .from('course_lessons')
        .update({ content_blocks_json: next })
        .eq('id', lessonId);
    if (error) {
        console.error('[course blocks] create error', error);
        return fail(500, 'Failed to create block');
    }
    return ok({ block });
}
/** Update an existing content block. */
export async function updateBlock(courseId, lessonId, blockId, userId, body) {
    const supabase = await createClient();
    const result = await loadLessonForCourse(supabase, courseId, lessonId, userId);
    if (!result.ok)
        return result;
    const blocks = result.data.blocks;
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx === -1)
        return fail(404, 'Block not found');
    const current = blocks[idx];
    const next = { ...current };
    if (body?.type !== undefined) {
        if (!isBlockType(body.type))
            return fail(400, 'Invalid block type');
        next.type = body.type;
    }
    if (body?.payload !== undefined) {
        if (body.payload === null || typeof body.payload !== 'object' || Array.isArray(body.payload)) {
            return fail(400, 'payload must be an object');
        }
        next.payload = body.payload;
    }
    if (body?.position !== undefined) {
        if (typeof body.position !== 'number' || !Number.isFinite(body.position)) {
            return fail(400, 'position must be a number');
        }
        next.position = Math.max(0, Math.round(body.position));
    }
    if (body?.status !== undefined) {
        if (!isStatus(body.status))
            return fail(400, 'Invalid status');
        next.status = body.status;
        next.published_at = body.status === 'published' ? new Date().toISOString() : null;
    }
    const updated = [...blocks];
    updated[idx] = next;
    const { error } = await supabase
        .from('course_lessons')
        .update({ content_blocks_json: updated })
        .eq('id', lessonId);
    if (error) {
        console.error('[course blocks] update error', error);
        return fail(500, 'Failed to update block');
    }
    return ok({ block: next });
}
/** Delete a content block. */
export async function deleteBlock(courseId, lessonId, blockId, userId) {
    const supabase = await createClient();
    const result = await loadLessonForCourse(supabase, courseId, lessonId, userId);
    if (!result.ok)
        return result;
    const blocks = result.data.blocks;
    const next = blocks.filter((b) => b.id !== blockId);
    if (next.length === blocks.length) {
        return fail(404, 'Block not found');
    }
    const { error } = await supabase
        .from('course_lessons')
        .update({ content_blocks_json: next })
        .eq('id', lessonId);
    if (error) {
        console.error('[course blocks] delete error', error);
        return fail(500, 'Failed to delete block');
    }
    return ok({ ok: true });
}
