import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/components/9a6b39502e62';
import { Button } from '@/components/2795b661f080';
import { Card } from '@/components/c0ebd3fbafc6';
import { Badge } from '@/components/30348591d689';
import { DeleteAllCoursesButton } from '@/components/688a07772c5c';
import { DeleteCourseButton } from '@/components/cc5d5f325546';
import { Clock, Layers, ListChecks, Pencil, Sparkles, Trash2, Users } from 'lucide-react';
export default async function TherapistCoursesPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        return null;
    }
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'therapist')
        return null;
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, description, is_published, thumbnail_path, created_at, updated_at')
        .eq('therapist_id', user.id)
        .order('updated_at', { ascending: false });
    if (coursesError) {
        return (<div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-xl border bg-white p-6 text-sm text-red-700">
          Failed to load courses: {coursesError.message}
        </div>
      </div>);
    }
    const courseRows = (courses ?? []).map((c) => ({
        id: c.id,
        title: c.title || 'Untitled',
        description: c.description || null,
        isPublished: Boolean(c.is_published),
        thumbnailPath: c.thumbnail_path || null,
        createdAt: c.created_at || null,
        updatedAt: c.updated_at || null,
    })) ?? [];
    const courseIds = courseRows.map((c) => c.id);
    const { data: modules } = courseIds.length
        ? await supabase
            .from('course_modules')
            .select('id, course_id, status')
            .in('course_id', courseIds)
        : { data: [] };
    const moduleIds = (modules ?? []).map((m) => String(m.id)).filter(Boolean);
    const { data: lessons } = moduleIds.length
        ? await supabase
            .from('course_lessons')
            .select('id, module_id, status, is_preview')
            .in('module_id', moduleIds)
        : { data: [] };
    const { data: assignments } = courseIds.length
        ? await supabase
            .from('course_assignments')
            .select('course_id, seeker_id, status')
            .in('course_id', courseIds)
        : { data: [] };
    const moduleCountByCourse = new Map();
    const publishedModuleCountByCourse = new Map();
    for (const m of modules ?? []) {
        const courseId = String(m.course_id);
        moduleCountByCourse.set(courseId, (moduleCountByCourse.get(courseId) || 0) + 1);
        if (String(m.status || 'draft') === 'published') {
            publishedModuleCountByCourse.set(courseId, (publishedModuleCountByCourse.get(courseId) || 0) + 1);
        }
    }
    const lessonCountByCourse = new Map();
    const previewLessonCountByCourse = new Map();
    const moduleToCourse = new Map();
    for (const m of modules ?? []) {
        moduleToCourse.set(String(m.id), String(m.course_id));
    }
    for (const l of lessons ?? []) {
        const moduleId = String(l.module_id);
        const courseId = moduleToCourse.get(moduleId);
        if (!courseId)
            continue;
        lessonCountByCourse.set(courseId, (lessonCountByCourse.get(courseId) || 0) + 1);
        if (Boolean(l.is_preview)) {
            previewLessonCountByCourse.set(courseId, (previewLessonCountByCourse.get(courseId) || 0) + 1);
        }
    }
    const assignedClientCountByCourse = new Map();
    const assignedSetByCourse = new Map();
    for (const a of assignments ?? []) {
        const courseId = String(a.course_id);
        const status = String(a.status || 'assigned');
        if (status === 'archived')
            continue;
        const seekerId = String(a.seeker_id);
        if (!seekerId)
            continue;
        if (!assignedSetByCourse.has(courseId))
            assignedSetByCourse.set(courseId, new Set());
        assignedSetByCourse.get(courseId).add(seekerId);
    }
    for (const [courseId, set] of assignedSetByCourse.entries()) {
        assignedClientCountByCourse.set(courseId, set.size);
    }
    return (<div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Your Courses</h1>
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
              {courseRows.length}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Manage your course catalog, outline, and publishing status.
          </p>
        </div>
        <div className="flex gap-2">
          <DeleteAllCoursesButton courseCount={courseRows.length}/>
          <Button asChild>
            <Link href="/therapist/courses/new">Create course</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courseRows.length === 0 ? (<div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-600 sm:col-span-2 lg:col-span-3">
            You haven&apos;t created any courses yet.
          </div>) : (courseRows.map((c) => {
            const moduleCount = moduleCountByCourse.get(c.id) || 0;
            const publishedModuleCount = publishedModuleCountByCourse.get(c.id) || 0;
            const lessonCount = lessonCountByCourse.get(c.id) || 0;
            const previewLessonCount = previewLessonCountByCourse.get(c.id) || 0;
            const assignedClients = assignedClientCountByCourse.get(c.id) || 0;
            const updatedLabel = c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '—';
            const thumbnailUrl = c.thumbnailPath ? `/api/therapist/courses/${c.id}/thumbnail` : null;
            return (<Card key={c.id} className="group relative h-[280px] w-full overflow-hidden rounded-xl border-0 bg-slate-900 shadow-md transition-all hover:shadow-xl">
                {/* Background Image */}
                {thumbnailUrl ? (<Image src={thumbnailUrl} alt={`Featured image for ${c.title}`} fill unoptimized className="object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-50" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>) : (<div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-600">
                    <Sparkles className="h-12 w-12 opacity-20"/>
                  </div>)}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300 group-hover:via-black/60"/>

                {/* Top Bar: Badge & Actions */}
                <div className="absolute left-4 top-4 right-4 flex items-start justify-between z-20">
                  <Badge variant="secondary" className={`backdrop-blur-md shadow-sm border-0 ${c.isPublished
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-amber-500/90 text-white'}`}>
                    {c.isPublished ? 'Published' : 'Draft'}
                  </Badge>

                  <div className="flex gap-2 opacity-100 translate-y-0 transition-all duration-300 sm:opacity-0 sm:-translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-0 shadow-sm" asChild>
                      <Link href={`/therapist/courses/${c.id}/edit`}>
                        <Pencil className="h-4 w-4"/>
                      </Link>
                    </Button>
                    <DeleteCourseButton courseId={c.id} courseTitle={c.title} trigger={<Button size="icon" variant="destructive" className="h-8 w-8 rounded-full bg-red-500/80 backdrop-blur-md hover:bg-red-600 border-0 shadow-sm cursor-pointer">
                          <Trash2 className="h-4 w-4"/>
                        </Button>}/>
                  </div>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                  <Link href={`/therapist/courses/${c.id}`} className="group/title block">
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover/title:text-indigo-300 transition-colors">
                      {c.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-300 line-clamp-1 mb-4">
                    {c.description || 'No description provided.'}
                  </p>

                  <div className="relative z-30 mb-3 flex gap-2">
                    <Button size="sm" variant="secondary" className="relative z-30 h-8 bg-white/90 text-slate-900 hover:bg-white" asChild>
                      <Link href={`/therapist/courses/${c.id}/edit#assignments`}>
                        <Users className="mr-1.5 h-3.5 w-3.5"/>
                        Assign
                      </Link>
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1.5" title={`${publishedModuleCount} published / ${moduleCount} total modules`}>
                      <Layers className="h-3.5 w-3.5 text-slate-500"/>
                      <span className="font-medium text-slate-300">{publishedModuleCount}/{moduleCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-slate-500"/>
                      <span className="font-medium text-slate-300">{lessonCount}</span>
                    </div>
                    {assignedClients > 0 && (<div className="flex items-center gap-1.5 text-blue-400">
                        <Users className="h-3.5 w-3.5"/>
                        <span className="font-medium">{assignedClients}</span>
                      </div>)}
                    <div className="ml-auto flex items-center gap-1.5" title={`Updated ${updatedLabel}`}>
                      <Clock className="h-3.5 w-3.5 text-slate-500"/>
                      <span className="font-medium text-slate-300">{updatedLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Full Card Link Area (behind buttons) */}
                <Link href={`/therapist/courses/${c.id}`} className="absolute inset-0 z-10" aria-label={`Open ${c.title}`}/>
              </Card>);
        }))}
      </div>
    </div>);
}
