import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import { Badge } from '@/components/30348591d689';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Separator } from '@/components/19cc3f2900f4';
import { ArrowLeft, Layers, ListChecks, Pencil, Eye, Video } from 'lucide-react';
export default async function TherapistCourseOverviewPage({ params, }) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        return null;
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'therapist')
        return null;
    const { data: course } = await supabase
        .from('courses')
        .select('id, therapist_id, title, description, is_published, created_at, updated_at')
        .eq('id', courseId)
        .eq('therapist_id', user.id)
        .maybeSingle();
    if (!course)
        notFound();
    const { data: modules } = await supabase
        .from('course_modules')
        .select('id, title, position, status, published_at')
        .eq('course_id', courseId)
        .order('position', { ascending: true });
    const moduleRows = (modules ?? []);
    const moduleIds = moduleRows.map((m) => m.id);
    const { data: lessons } = moduleIds.length
        ? await supabase
            .from('course_lessons')
            .select('id, module_id, title, position, status, is_preview, video_path')
            .in('module_id', moduleIds)
            .order('position', { ascending: true })
        : { data: [] };
    const lessonRows = (lessons ?? []);
    const lessonsByModule = new Map();
    for (const l of lessonRows) {
        if (!lessonsByModule.has(l.module_id))
            lessonsByModule.set(l.module_id, []);
        lessonsByModule.get(l.module_id).push(l);
    }
    const moduleCount = moduleRows.length;
    const publishedModuleCount = moduleRows.filter((m) => m.status === 'published').length;
    const lessonCount = lessonRows.length;
    const previewLessonCount = lessonRows.filter((l) => l.is_preview).length;
    const videoLessonCount = lessonRows.filter((l) => Boolean(l.video_path)).length;
    const updatedAtLabel = course.updated_at ? new Date(course.updated_at).toLocaleString() : '—';
    return (<div className="mx-auto w-full max-w-6xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="pl-0">
          <Link href="/therapist/courses">
            <ArrowLeft className="h-4 w-4 mr-2"/>
            Back to courses
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/therapist/courses/${courseId}/edit`}>
              <Pencil className="h-4 w-4 mr-2"/>
              Edit builder
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-0 ring-1 ring-black/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-2xl line-clamp-2">{course.title}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={course.is_published
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-amber-50 text-amber-800 border-amber-100'}>
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                  Updated {updatedAtLabel}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {course.description || 'No description yet.'}
          </p>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Layers className="h-4 w-4"/> Modules
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {publishedModuleCount}/{moduleCount}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ListChecks className="h-4 w-4"/> Lessons
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{lessonCount}</div>
              <div className="text-[11px] text-gray-500">{previewLessonCount} preview</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Video className="h-4 w-4"/> With video
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{videoLessonCount}</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Eye className="h-4 w-4"/> Access
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                Courses are accessible to your active clients.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 ring-1 ring-black/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Course outline</CardTitle>
        </CardHeader>
        <CardContent>
          {moduleRows.length === 0 ? (<div className="rounded-lg border bg-white p-6 text-sm text-gray-600">
              No modules yet. Create modules and lessons in the course builder.
              <div className="mt-3">
                <Button asChild>
                  <Link href={`/therapist/courses/${courseId}/edit`}>Open builder</Link>
                </Button>
              </div>
            </div>) : (<div className="space-y-4">
              {moduleRows.map((m) => {
                const lessonsForModule = lessonsByModule.get(m.id) || [];
                return (<div key={m.id} className="rounded-xl border bg-white">
                    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {m.position + 1}. {m.title}
                          </div>
                          <Badge variant="secondary" className={m.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-gray-100 text-gray-700 border-gray-200'}>
                            {m.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {lessonsForModule.length} lesson(s)
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/therapist/courses/${courseId}/edit`}>Edit</Link>
                      </Button>
                    </div>

                    {lessonsForModule.length > 0 ? <Separator /> : null}

                    {lessonsForModule.length > 0 ? (<div className="divide-y">
                        {lessonsForModule.map((l) => (<div key={l.id} className="p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-900 line-clamp-1">
                                  {m.position + 1}.{l.position + 1} {l.title}
                                </div>
                                {l.is_preview ? (<Badge variant="outline" className="text-xs">
                                    Preview
                                  </Badge>) : null}
                                <Badge variant="secondary" className={l.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-gray-100 text-gray-700 border-gray-200'}>
                                  {l.status}
                                </Badge>
                                {l.video_path ? (<Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                                    Video
                                  </Badge>) : null}
                              </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/therapist/courses/${courseId}/edit`}>Open</Link>
                            </Button>
                          </div>))}
                      </div>) : null}
                  </div>);
            })}
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
