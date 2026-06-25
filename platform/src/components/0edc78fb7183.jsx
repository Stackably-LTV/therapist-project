import { notFound } from 'next/navigation';
import { CourseEditor } from '@/components/095375b9462e';
import { createClient } from '@/components/9a6b39502e62';
export default async function TherapistCourseEditPage({ params, }) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        return notFound();
    const { data: userRow, error: userErr } = await supabase.from('user_roles').select('id, role').eq('id', user.id).single();
    if (userErr || !userRow || userRow.role !== 'therapist')
        return notFound();
    const { data: courseRow, error: courseErr } = await supabase
        .from('courses')
        .select('id, therapist_id, title, description, price_cents, currency, is_published, thumbnail_path')
        .eq('id', courseId)
        .single();
    if (courseErr || !courseRow || courseRow.therapist_id !== user.id)
        return notFound();
    const { data: moduleRows, error: modulesErr } = await supabase
        .from('course_modules')
        .select('id, title, position, status, published_at')
        .eq('course_id', courseRow.id)
        .order('position', { ascending: true });
    if (modulesErr)
        return notFound();
    const moduleIds = (moduleRows ?? []).map((m) => m.id);
    const { data: lessonRows, error: lessonsErr } = moduleIds.length
        ? await supabase
            .from('course_lessons')
            .select('id, module_id, title, position, is_preview, video_path, status, published_at')
            .in('module_id', moduleIds)
            .order('position', { ascending: true })
        : { data: [], error: null };
    if (lessonsErr)
        return notFound();
    const lessonsByModule = new Map();
    for (const l of lessonRows ?? []) {
        const key = l.module_id;
        const arr = lessonsByModule.get(key) ?? [];
        arr.push(l);
        lessonsByModule.set(key, arr);
    }
    const course = {
        id: courseRow.id,
        title: courseRow.title,
        description: courseRow.description,
        priceCents: courseRow.price_cents,
        currency: courseRow.currency,
        isPublished: courseRow.is_published,
        thumbnailPath: courseRow.thumbnail_path ?? null,
        modules: (moduleRows ?? []).map((m) => ({
            id: m.id,
            title: m.title,
            position: m.position,
            status: m.status,
            publishedAt: m.published_at,
            lessons: (lessonsByModule.get(m.id) ?? []).map((l) => ({
                id: l.id,
                title: l.title,
                position: l.position,
                isPreview: l.is_preview,
                videoPath: l.video_path,
                status: l.status,
                publishedAt: l.published_at,
            })),
        })),
    };
    return (<div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Course</h1>
        <p className="mt-1 text-sm text-gray-600">Build your curriculum and publish when ready.</p>
      </div>

      <CourseEditor courseId={courseId} initialCourse={course}/>
    </div>);
}
