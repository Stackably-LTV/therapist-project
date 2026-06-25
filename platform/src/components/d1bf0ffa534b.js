import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
function isStatus(v) {
    return v === 'draft' || v === 'published' || v === 'archived';
}
async function ensureLessonInCourse(supabase, courseId, lessonId, userId) {
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
    return ok(null);
}
async function ensureAssessmentInCourse(supabase, courseId, lessonId, assessmentId, userId) {
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
    const { data: assessment } = await supabase
        .from('course_assessments')
        .select('id, lesson_id')
        .eq('id', assessmentId)
        .maybeSingle();
    if (!assessment || assessment.lesson_id !== lessonId) {
        return fail(404, 'Assessment not found');
    }
    return ok(null);
}
async function loadAssessmentForCourse(supabase, courseId, lessonId, assessmentId, userId) {
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
    const { data: assessment } = await supabase
        .from('course_assessments')
        .select('id, lesson_id, questions_json')
        .eq('id', assessmentId)
        .maybeSingle();
    if (!assessment || assessment.lesson_id !== lessonId) {
        return fail(404, 'Assessment not found');
    }
    const questions = Array.isArray(assessment.questions_json)
        ? assessment.questions_json
        : [];
    return ok({ questions });
}
/** List a lesson's assessments with hydrated/sorted questions+options. */
export async function listAssessments(courseId, lessonId, userId) {
    const supabase = await createClient();
    const guard = await ensureLessonInCourse(supabase, courseId, lessonId, userId);
    if (!guard.ok)
        return guard;
    const { data: assessments, error } = await supabase
        .from('course_assessments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });
    if (error) {
        console.error('[course assessments] list error', error);
        return fail(500, 'Failed to load assessments');
    }
    const hydrated = (assessments ?? []).map((a) => {
        const questions = Array.isArray(a.questions_json) ? a.questions_json : [];
        const sortedQuestions = [...questions]
            .sort((q1, q2) => (q1.position ?? 0) - (q2.position ?? 0))
            .map((q) => ({
            ...q,
            options: Array.isArray(q.options)
                ? [...q.options].sort((o1, o2) => (o1.position ?? 0) - (o2.position ?? 0))
                : [],
        }));
        return { ...a, questions: sortedQuestions };
    });
    return ok({ assessments: hydrated });
}
/** Create a new assessment on a lesson. */
export async function createAssessment(courseId, lessonId, userId, body) {
    const supabase = await createClient();
    const guard = await ensureLessonInCourse(supabase, courseId, lessonId, userId);
    if (!guard.ok)
        return guard;
    const title = String(body?.title ?? '').trim();
    const passingScoreRaw = body?.passingScore;
    const status = body?.status;
    if (!title)
        return fail(400, 'title is required');
    if (passingScoreRaw !== undefined && (typeof passingScoreRaw !== 'number' || !Number.isFinite(passingScoreRaw))) {
        return fail(400, 'passingScore must be a number');
    }
    if (status !== undefined && !isStatus(status)) {
        return fail(400, 'Invalid status');
    }
    const insert = {
        lesson_id: lessonId,
        title,
        passing_score: typeof passingScoreRaw === 'number' && Number.isFinite(passingScoreRaw)
            ? Math.max(0, Math.min(100, Math.round(passingScoreRaw)))
            : null,
        questions_json: [],
    };
    if (isStatus(status)) {
        insert.status = status;
        if (status === 'published')
            insert.published_at = new Date().toISOString();
    }
    const { data, error } = await supabase
        .from('course_assessments')
        .insert(insert)
        .select('*')
        .single();
    if (error) {
        console.error('[course assessments] create error', error);
        return fail(500, 'Failed to create assessment');
    }
    return ok({ assessment: data });
}
/** Update an assessment. */
export async function updateAssessment(courseId, lessonId, assessmentId, userId, body) {
    const supabase = await createClient();
    const guard = await ensureAssessmentInCourse(supabase, courseId, lessonId, assessmentId, userId);
    if (!guard.ok)
        return guard;
    const patch = {};
    if (body?.title !== undefined)
        patch.title = String(body.title).trim();
    if (body?.passingScore !== undefined) {
        if (body.passingScore === null)
            patch.passing_score = null;
        else if (typeof body.passingScore !== 'number' || !Number.isFinite(body.passingScore)) {
            return fail(400, 'passingScore must be a number');
        }
        else {
            patch.passing_score = Math.max(0, Math.min(100, Math.round(body.passingScore)));
        }
    }
    if (body?.status !== undefined) {
        if (!isStatus(body.status))
            return fail(400, 'Invalid status');
        patch.status = body.status;
        patch.published_at = body.status === 'published' ? new Date().toISOString() : null;
    }
    const { data, error } = await supabase
        .from('course_assessments')
        .update(patch)
        .eq('id', assessmentId)
        .select('*')
        .single();
    if (error) {
        console.error('[course assessments] update error', error);
        return fail(500, 'Failed to update assessment');
    }
    return ok({ assessment: data });
}
/** Delete an assessment. */
export async function deleteAssessment(courseId, lessonId, assessmentId, userId) {
    const supabase = await createClient();
    const guard = await ensureAssessmentInCourse(supabase, courseId, lessonId, assessmentId, userId);
    if (!guard.ok)
        return guard;
    const { error } = await supabase.from('course_assessments').delete().eq('id', assessmentId);
    if (error) {
        console.error('[course assessments] delete error', error);
        return fail(500, 'Failed to delete assessment');
    }
    return ok({ ok: true });
}
/** Append a question to an assessment's questions_json. */
export async function createQuestion(courseId, lessonId, assessmentId, userId, body) {
    const supabase = await createClient();
    const result = await loadAssessmentForCourse(supabase, courseId, lessonId, assessmentId, userId);
    if (!result.ok)
        return result;
    const questions = result.data.questions;
    const prompt = String(body?.prompt ?? '').trim();
    if (!prompt)
        return fail(400, 'prompt is required');
    const positionRaw = body?.position;
    const position = typeof positionRaw === 'number' && Number.isFinite(positionRaw)
        ? Math.max(0, Math.round(positionRaw))
        : questions.length;
    const question = {
        id: crypto.randomUUID(),
        prompt,
        position,
        options: [],
    };
    const next = [...questions, question];
    const { error } = await supabase
        .from('course_assessments')
        .update({ questions_json: next })
        .eq('id', assessmentId);
    if (error) {
        console.error('[course assessment questions] create error', error);
        return fail(500, 'Failed to create question');
    }
    return ok({ question });
}
/** Append an option to a question; optionally set it as the correct answer key. */
export async function createOption(courseId, lessonId, assessmentId, questionId, userId, body) {
    const supabase = await createClient();
    const result = await loadAssessmentForCourse(supabase, courseId, lessonId, assessmentId, userId);
    if (!result.ok)
        return result;
    const questions = result.data.questions;
    const qIdx = questions.findIndex((q) => q.id === questionId);
    if (qIdx === -1)
        return fail(404, 'Question not found');
    const label = String(body?.label ?? '').trim();
    const isCorrect = !!body?.isCorrect;
    if (!label)
        return fail(400, 'label is required');
    const positionRaw = body?.position;
    const existingOptions = questions[qIdx].options ?? [];
    const position = typeof positionRaw === 'number' && Number.isFinite(positionRaw)
        ? Math.max(0, Math.round(positionRaw))
        : existingOptions.length;
    const option = {
        id: crypto.randomUUID(),
        label,
        position,
    };
    const updatedQuestions = [...questions];
    updatedQuestions[qIdx] = {
        ...questions[qIdx],
        options: [...existingOptions, option],
    };
    const { error } = await supabase
        .from('course_assessments')
        .update({ questions_json: updatedQuestions })
        .eq('id', assessmentId);
    if (error) {
        console.error('[course assessment options] create error', error);
        return fail(500, 'Failed to create option');
    }
    if (isCorrect) {
        const { error: keyErr } = await supabase
            .from('course_assessment_answer_keys')
            .upsert({ question_id: questionId, correct_option_id: option.id }, { onConflict: 'question_id' });
        if (keyErr) {
            console.error('[course assessment answer key] upsert error', keyErr);
            return fail(500, 'Failed to set correct answer');
        }
    }
    return ok({ option });
}
