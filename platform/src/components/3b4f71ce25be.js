/**
 * Course Publishing Service - Handles cascading publication of courses
 * Lesson content blocks now live in `course_lessons.content_blocks_json` (JSONB),
 * so we no longer cascade into a separate blocks table.
 */
import { createClient } from '@/components/9a6b39502e62';
export class CoursePublishingService {
    /**
     * Publish a course and all its modules + lessons.
     * Lesson content blocks (jsonb) follow the lesson's status, so they don't
     * need a separate update.
     */
    async publishCourse(courseId) {
        try {
            const supabase = await createClient();
            const now = new Date().toISOString();
            // 1. Publish the course itself
            const { data: courseRow, error: courseError } = await supabase
                .from('courses')
                .update({ is_published: true, updated_at: now })
                .eq('id', courseId)
                .select('id')
                .maybeSingle();
            if (courseError)
                throw courseError;
            if (!courseRow) {
                return { success: false, error: 'Course not found' };
            }
            // 2. Publish all modules for this course
            const { data: moduleRows, error: moduleError } = await supabase
                .from('course_modules')
                .update({ status: 'published', published_at: now, updated_at: now })
                .eq('course_id', courseId)
                .select('id');
            if (moduleError)
                throw moduleError;
            const moduleIds = (moduleRows ?? []).map((m) => m.id);
            // 3. Publish all lessons whose module belongs to this course
            let lessonsUpdated = 0;
            let blocksUpdated = 0;
            if (moduleIds.length > 0) {
                const { data: lessonRows, error: lessonError } = await supabase
                    .from('course_lessons')
                    .update({ status: 'published', published_at: now, updated_at: now })
                    .in('module_id', moduleIds)
                    .select('id, content_blocks_json');
                if (lessonError)
                    throw lessonError;
                lessonsUpdated = (lessonRows ?? []).length;
                // 4. Update each lesson's content_blocks_json so blocks reflect publish state
                for (const lesson of lessonRows ?? []) {
                    const blocks = Array.isArray(lesson.content_blocks_json)
                        ? lesson.content_blocks_json
                        : [];
                    if (blocks.length === 0)
                        continue;
                    const updatedBlocks = blocks.map((b) => ({
                        ...b,
                        status: 'published',
                        published_at: now,
                    }));
                    const { error: blockError } = await supabase
                        .from('course_lessons')
                        .update({ content_blocks_json: updatedBlocks })
                        .eq('id', lesson.id);
                    if (blockError)
                        throw blockError;
                    blocksUpdated += updatedBlocks.length;
                }
            }
            return {
                success: true,
                coursesUpdated: 1,
                modulesUpdated: moduleIds.length,
                lessonsUpdated,
                blocksUpdated,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[CoursePublishingService] publishCourse failed:', {
                courseId,
                error: errorMessage,
            });
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Unpublish a course and all its nested content.
     */
    async unpublishCourse(courseId) {
        try {
            const supabase = await createClient();
            const now = new Date().toISOString();
            const { data: courseRow, error: courseError } = await supabase
                .from('courses')
                .update({ is_published: false, updated_at: now })
                .eq('id', courseId)
                .select('id')
                .maybeSingle();
            if (courseError)
                throw courseError;
            if (!courseRow) {
                return { success: false, error: 'Course not found' };
            }
            const { data: moduleRows, error: moduleError } = await supabase
                .from('course_modules')
                .update({ status: 'draft', published_at: null, updated_at: now })
                .eq('course_id', courseId)
                .select('id');
            if (moduleError)
                throw moduleError;
            const moduleIds = (moduleRows ?? []).map((m) => m.id);
            let lessonsUpdated = 0;
            let blocksUpdated = 0;
            if (moduleIds.length > 0) {
                const { data: lessonRows, error: lessonError } = await supabase
                    .from('course_lessons')
                    .update({ status: 'draft', published_at: null, updated_at: now })
                    .in('module_id', moduleIds)
                    .select('id, content_blocks_json');
                if (lessonError)
                    throw lessonError;
                lessonsUpdated = (lessonRows ?? []).length;
                for (const lesson of lessonRows ?? []) {
                    const blocks = Array.isArray(lesson.content_blocks_json)
                        ? lesson.content_blocks_json
                        : [];
                    if (blocks.length === 0)
                        continue;
                    const updatedBlocks = blocks.map((b) => ({
                        ...b,
                        status: 'draft',
                        published_at: null,
                    }));
                    const { error: blockError } = await supabase
                        .from('course_lessons')
                        .update({ content_blocks_json: updatedBlocks })
                        .eq('id', lesson.id);
                    if (blockError)
                        throw blockError;
                    blocksUpdated += updatedBlocks.length;
                }
            }
            return {
                success: true,
                coursesUpdated: 1,
                modulesUpdated: moduleIds.length,
                lessonsUpdated,
                blocksUpdated,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[CoursePublishingService] unpublishCourse failed:', {
                courseId,
                error: errorMessage,
            });
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Get publishing status of a course (counts of modules/lessons published).
     */
    async getCoursePublishingStatus(courseId) {
        try {
            const supabase = await createClient();
            const { data: course } = await supabase
                .from('courses')
                .select('id, is_published')
                .eq('id', courseId)
                .maybeSingle();
            if (!course)
                return null;
            const { data: modules } = await supabase
                .from('course_modules')
                .select('id, status')
                .eq('course_id', courseId);
            const moduleIds = (modules ?? []).map((m) => m.id);
            let totalLessons = 0;
            let publishedLessons = 0;
            if (moduleIds.length > 0) {
                const { data: lessons } = await supabase
                    .from('course_lessons')
                    .select('id, status')
                    .in('module_id', moduleIds);
                totalLessons = (lessons ?? []).length;
                publishedLessons = (lessons ?? []).filter((l) => l.status === 'published').length;
            }
            return {
                id: course.id,
                is_published: course.is_published,
                total_modules: (modules ?? []).length,
                published_modules: (modules ?? []).filter((m) => m.status === 'published').length,
                total_lessons: totalLessons,
                published_lessons: publishedLessons,
            };
        }
        catch (error) {
            console.error('[CoursePublishingService] getCoursePublishingStatus failed:', error);
            return null;
        }
    }
}
export const coursePublishingService = new CoursePublishingService();
