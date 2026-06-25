import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import { CoursePlayer } from '@/components/004bc16e681b';
export default async function SeekerCourseLearnPage({ params }) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: profile } = await supabase.from('user_roles').select('id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'seeker')
        redirect('/login');
    const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .eq('id', courseId)
        .single();
    if (courseErr || !course || !course.is_published)
        return notFound();
    const { data: modules, error: modulesErr } = await supabase
        .from('course_modules')
        .select('id, title, position')
        .eq('course_id', course.id)
        .eq('status', 'published')
        .order('position', { ascending: true });
    if (modulesErr)
        return notFound();
    const moduleIds = (modules ?? []).map((m) => m.id);
    const { data: lessons } = moduleIds.length
        ? await supabase
            .from('course_lessons')
            .select('id, module_id, title, position, is_preview')
            .in('module_id', moduleIds)
            .order('position', { ascending: true })
        : { data: [] };
    const lessonsByModule = new Map();
    for (const l of lessons ?? []) {
        const key = l.module_id;
        const arr = lessonsByModule.get(key) ?? [];
        arr.push(l);
        lessonsByModule.set(key, arr);
    }
    const shapedModules = (modules ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        position: m.position,
        lessons: (lessonsByModule.get(m.id) ?? []).map((l) => ({
            id: l.id,
            title: l.title,
            position: l.position,
            isPreview: l.is_preview,
        })),
    }));
    return (<div className="space-y-6">
      <CoursePlayer courseId={course.id} title={course.title} modules={shapedModules}/>
    </div>);
}
