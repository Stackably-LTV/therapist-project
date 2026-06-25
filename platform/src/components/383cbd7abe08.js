import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { createClient as createServiceClient } from '@supabase/supabase-js';
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
function isAnswerArray(v) {
    if (!Array.isArray(v))
        return false;
    return v.every((x) => x &&
        typeof x === 'object' &&
        typeof x.questionId === 'string' &&
        typeof x.optionId === 'string' &&
        x.questionId.trim().length > 0 &&
        x.optionId.trim().length > 0);
}
/** Public, published course listing with optional title search. */
export async function listPublishedCourses(q, limit) {
    const supabase = await createClient();
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 50, 1), 200);
    let query = supabase
        .from('courses')
        .select(`
        id,
        therapist_id,
        title,
        description,
        price_cents,
        currency,
        thumbnail_path,
        is_published,
        created_at
      `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(safeLimit);
    const trimmed = q.trim();
    if (trimmed) {
        query = query.ilike('title', `%${trimmed}%`);
    }
    const { data: rawCourses, error } = await query;
    const therapistIds = Array.from(new Set((rawCourses ?? []).map((c) => c.therapist_id).filter(Boolean)));
    const { data: therapistProfiles } = therapistIds.length
        ? await supabase.from('user_profiles').select('user_id, full_name').in('user_id', therapistIds)
        : { data: [] };
    const nameById = new Map();
    therapistProfiles?.forEach((p) => nameById.set(p.user_id, p.full_name));
    const courses = (rawCourses ?? []).map((c) => ({
        ...c,
        therapist: { id: c.therapist_id, name: nameById.get(c.therapist_id) ?? '' },
    }));
    if (error) {
        console.error('[api/courses] list error', error);
        return fail(500, 'Failed to load courses');
    }
    return ok({ courses: courses ?? [] });
}
/** Public course detail with modules/lessons gated by ownership/purchase. */
export async function getCourseDetail(courseId, userId) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();
    if (!course) {
        return fail(404, 'Course not found');
    }
    const isOwner = !!userId && userId === course.therapist_id;
    if (!course.is_published && !isOwner) {
        return fail(404, 'Course not found');
    }
    let hasActivePurchase = false;
    if (userId && !isOwner) {
        const { data: ent } = await supabase
            .from('billing_course_entitlements')
            .select('id')
            .eq('course_id', courseId)
            .eq('purchaser_id', userId)
            .eq('status', 'active')
            .maybeSingle();
        hasActivePurchase = !!ent;
    }
    const canSeeAllLessons = isOwner || hasActivePurchase;
    const { data: therapistProfile } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .eq('user_id', course.therapist_id)
        .maybeSingle();
    const { data: modules } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true });
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: lessons } = moduleIds.length
        ? await supabase
            .from('course_lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('position', { ascending: true })
        : { data: [] };
    const lessonsByModule = new Map();
    (lessons || []).forEach((l) => {
        const arr = lessonsByModule.get(l.module_id) || [];
        arr.push(l);
        lessonsByModule.set(l.module_id, arr);
    });
    const modulesWithLessons = (modules || []).map((m) => {
        const ls = lessonsByModule.get(m.id) || [];
        const filtered = canSeeAllLessons ? ls : ls.filter((l) => l.is_preview);
        return { ...m, lessons: filtered };
    });
    return ok({
        course: {
            ...course,
            therapist: therapistProfile
                ? { id: therapistProfile.user_id, name: therapistProfile.full_name }
                : null,
            modules: modulesWithLessons,
        },
        viewer: {
            isOwner,
            hasActivePurchase,
            canSeeAllLessons,
        },
    });
}
/** Seeker checkout (creates an active entitlement). */
export async function checkoutCourse(courseId, userId, appUrl) {
    const supabase = await createClient();
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id, is_published')
        .eq('id', courseId)
        .maybeSingle();
    if (!course || !course.is_published) {
        return fail(404, 'Course not found');
    }
    if (course.therapist_id === userId) {
        return fail(409, 'You already own this course');
    }
    const { data: existing } = await supabase
        .from('billing_course_entitlements')
        .select('id')
        .eq('course_id', course.id)
        .eq('purchaser_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    if (existing) {
        return ok({
            alreadyOwned: true,
            redirectUrl: `${appUrl}/courses/${course.id}/learn`,
        });
    }
    const { data: purchase, error } = await supabase
        .from('billing_course_entitlements')
        .insert({
        course_id: course.id,
        purchaser_id: userId,
        status: 'active',
    })
        .select('id')
        .single();
    if (error || !purchase) {
        console.error('[api/courses/[courseId]/checkout] insert error', error);
        return fail(500, 'Failed to create checkout');
    }
    return ok({
        redirectUrl: `${appUrl}/courses/${course.id}/learn`,
        sessionId: purchase.id,
    });
}
/** Public lesson detail (RLS-gated) including blocks + assessments. */
export async function getLessonDetail(courseId, lessonId) {
    const supabase = await createClient();
    const { data: lesson, error: lessonErr } = await supabase
        .from('course_lessons')
        .select('id, module_id, title, position, video_path, duration_seconds, is_preview, status, published_at, content_blocks_json')
        .eq('id', lessonId)
        .single();
    if (lessonErr || !lesson)
        return fail(404, 'Lesson not found');
    const { data: mod, error: modErr } = await supabase
        .from('course_modules')
        .select('id, course_id, title, position, status, published_at')
        .eq('id', lesson.module_id)
        .single();
    if (modErr || !mod || mod.course_id !== courseId) {
        return fail(404, 'Lesson not found');
    }
    const blocks = Array.isArray(lesson.content_blocks_json)
        ? lesson.content_blocks_json
        : [];
    const { data: assessments, error: assessErr } = await supabase
        .from('course_assessments')
        .select(`
        id,
        lesson_id,
        title,
        passing_score,
        status,
        published_at,
        questions:course_assessment_questions(
          id,
          assessment_id,
          prompt,
          position,
          options:course_assessment_options(
            id,
            question_id,
            label,
            position
          )
        )
      `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });
    if (assessErr) {
        console.error('[course lesson] assessments error', assessErr);
        return fail(500, 'Failed to load assessments');
    }
    return ok({
        lesson: {
            ...lesson,
            module: mod,
            blocks: blocks ?? [],
            assessments: assessments ?? [],
        },
    });
}
/** Resolve a signed URL for a lesson asset (RLS-gated). Returns the URL to redirect to. */
export async function getLessonAssetSignedUrl(courseId, lessonId, storagePathRaw) {
    const supabase = await createClient();
    if (!storagePathRaw)
        return fail(400, 'path is required');
    const normalized = storagePathRaw.trim();
    const parts = normalized.split('/');
    const bucket = parts.length > 1 ? parts[0] : 'course-media';
    const objectPath = parts.length > 1 ? parts.slice(1).join('/') : normalized;
    if (bucket !== 'course-media' || !isSafeStoragePath(objectPath)) {
        return fail(400, 'Invalid asset path');
    }
    const { data: lesson, error: lessonErr } = await supabase
        .from('course_lessons')
        .select('id, module_id')
        .eq('id', lessonId)
        .single();
    if (lessonErr || !lesson)
        return fail(404, 'Not found');
    const { data: mod, error: modErr } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .eq('id', lesson.module_id)
        .single();
    if (modErr || !mod || mod.course_id !== courseId)
        return fail(404, 'Not found');
    const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await serviceClient.storage.from(bucket).createSignedUrl(objectPath, 60 * 30);
    if (error || !data?.signedUrl) {
        console.error('[course asset] createSignedUrl error', error);
        return fail(500, 'Failed to create signed URL');
    }
    return ok({ signedUrl: data.signedUrl });
}
/** Resolve a signed URL for a lesson's uploaded video (RLS-gated). */
export async function getLessonVideoSignedUrl(courseId, lessonId) {
    const supabase = await createClient();
    const { data: lesson, error: lessonErr } = await supabase
        .from('course_lessons')
        .select('id, module_id, video_path')
        .eq('id', lessonId)
        .single();
    if (lessonErr || !lesson)
        return fail(404, 'Lesson not found');
    const { data: mod, error: modErr } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .eq('id', lesson.module_id)
        .single();
    if (modErr || !mod || mod.course_id !== courseId)
        return fail(404, 'Lesson not found');
    const videoPathRaw = String(lesson.video_path || '').trim();
    if (!videoPathRaw) {
        return fail(404, 'Video not uploaded yet');
    }
    const parts = videoPathRaw.split('/');
    const bucket = parts.length > 1 ? parts[0] : 'course-media';
    const path = parts.length > 1 ? parts.slice(1).join('/') : videoPathRaw;
    if (bucket !== 'course-media' || !isSafeStoragePath(path)) {
        return fail(400, 'Invalid video path');
    }
    const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await serviceClient.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 30); // 30 minutes
    if (error || !data?.signedUrl) {
        console.error('[course video-url] createSignedUrl error', error);
        return fail(500, 'Failed to create signed URL');
    }
    return ok({ signedUrl: data.signedUrl });
}
/** Grade and store an assessment submission. */
export async function submitAssessment(courseId, assessmentId, userId, answersRaw) {
    const supabase = await createClient();
    if (!isAnswerArray(answersRaw)) {
        return fail(400, 'answers must be an array of { questionId, optionId }');
    }
    const { data: assessment, error: aErr } = await supabase
        .from('course_assessments')
        .select('id, lesson_id, passing_score')
        .eq('id', assessmentId)
        .single();
    if (aErr || !assessment)
        return fail(404, 'Assessment not found');
    const { data: lesson, error: lErr } = await supabase
        .from('course_lessons')
        .select('id, module_id')
        .eq('id', assessment.lesson_id)
        .single();
    if (lErr || !lesson)
        return fail(404, 'Assessment not found');
    const { data: mod, error: mErr } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .eq('id', lesson.module_id)
        .single();
    if (mErr || !mod || mod.course_id !== courseId)
        return fail(404, 'Assessment not found');
    const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: questions, error: qErr } = await serviceClient
        .from('course_assessment_questions')
        .select('id')
        .eq('assessment_id', assessmentId);
    if (qErr) {
        console.error('[assessment submit] questions error', qErr);
        return fail(500, 'Failed to grade submission');
    }
    const questionIds = new Set((questions ?? []).map((q) => q.id));
    if (questionIds.size === 0)
        return fail(400, 'Assessment has no questions');
    const normalized = answersRaw.map((a) => ({ questionId: a.questionId.trim(), optionId: a.optionId.trim() }));
    const answerByQuestion = new Map();
    for (const a of normalized) {
        if (questionIds.has(a.questionId))
            answerByQuestion.set(a.questionId, a.optionId);
    }
    const { data: keys, error: kErr } = await serviceClient
        .from('course_assessment_answer_keys')
        .select('question_id, correct_option_id')
        .in('question_id', Array.from(questionIds));
    if (kErr) {
        console.error('[assessment submit] answer keys error', kErr);
        return fail(500, 'Failed to grade submission');
    }
    const keyByQuestion = new Map();
    for (const k of keys ?? [])
        keyByQuestion.set(k.question_id, k.correct_option_id);
    let correct = 0;
    let total = 0;
    for (const qId of questionIds) {
        const correctOpt = keyByQuestion.get(qId);
        if (!correctOpt)
            continue;
        total += 1;
        const chosen = answerByQuestion.get(qId);
        if (chosen && chosen === correctOpt)
            correct += 1;
    }
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passingScore = typeof assessment.passing_score === 'number' ? assessment.passing_score : null;
    const passed = passingScore === null ? null : score >= passingScore;
    const { data: submission, error: sErr } = await supabase
        .from('course_assessment_submissions')
        .insert({
        assessment_id: assessmentId,
        user_id: userId,
        answers_json: normalized,
        score,
        passed,
    })
        .select('*')
        .single();
    if (sErr) {
        console.error('[assessment submit] insert error', sErr);
        return fail(500, 'Failed to submit assessment');
    }
    return ok({ submission });
}
