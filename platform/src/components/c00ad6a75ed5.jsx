import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { BookOpenCheck } from 'lucide-react';
export default async function SeekerCoursesPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: profile } = await supabase.from('user_roles').select('id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'seeker')
        redirect('/login');
    const { data: rawCourses, error: coursesErr } = await supabase
        .from('courses')
        .select('id, title, description, is_published, created_at, therapist_id')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
    const therapistIdsCourse = Array.from(new Set((rawCourses ?? []).map((c) => c.therapist_id).filter(Boolean)));
    const { data: therapistProfilesCourse } = therapistIdsCourse.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', therapistIdsCourse)
        : { data: [] };
    const courseTherapistName = new Map();
    therapistProfilesCourse?.forEach((p) => courseTherapistName.set(p.user_id, p.full_name));
    const courses = (rawCourses ?? []).map((c) => ({
        ...c,
        therapist: { id: c.therapist_id, name: courseTherapistName.get(c.therapist_id) ?? '' },
    }));
    const hasLoadError = Boolean(coursesErr);
    const list = courses;
    return (<div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Courses</h1>
        <p className="text-sm text-gray-600">
          Courses from therapists you&apos;ve had sessions with.
        </p>
      </div>

      {hasLoadError && (<div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">We could not load your courses.</p>
          <p className="mt-1">Please refresh and try again.</p>
          <Button asChild variant="outline" className="mt-3 border-red-200 bg-white text-red-700 hover:bg-red-100">
            <Link href="/seeker/courses">Retry</Link>
          </Button>
        </div>)}

      {list.length === 0 ? (<div className="rounded-xl border border-dashed bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <BookOpenCheck className="h-7 w-7 text-indigo-600" aria-hidden="true"/>
          </div>
          <h2 className="text-base font-semibold text-gray-900">No courses available yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Your therapist can publish self-paced resources here after you begin sessions.
          </p>
          <Button asChild className="mt-5">
            <Link href="/seeker/therapists">Browse Therapists</Link>
          </Button>
        </div>) : (<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
                return (<Card key={c.id} className="h-full">
                <CardHeader className="gap-1">
                  <CardTitle className="line-clamp-2">{c.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{c.description || 'Self-paced course'}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    {c.therapist?.name ? <span className="text-xs text-gray-500">by {c.therapist.name}</span> : null}
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/seeker/courses/${c.id}`}>Open</Link>
                  </Button>
                </CardFooter>
              </Card>);
            })}
        </div>)}
    </div>);
}
