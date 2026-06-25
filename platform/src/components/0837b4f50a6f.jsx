import { NewCourseForm } from '@/components/79331aae4ce7';
import Link from 'next/link';
import { Button } from '@/components/2795b661f080';
import { ArrowLeft, Sparkles } from 'lucide-react';
export default function NewTherapistCoursePage() {
    return (<div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="pl-0">
          <Link href="/therapist/courses">
            <ArrowLeft className="h-4 w-4 mr-2"/>
            Back to courses
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create a Course</h1>
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 ring-1 ring-indigo-100 p-2">
                <Sparkles className="h-5 w-5 text-indigo-600"/>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Set the basics first. After creating, you’ll add modules, lessons, videos, blocks, quizzes, and assignments in the builder.
            </p>
          </div>
          <NewCourseForm />
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border bg-white p-6 sticky top-24">
            <div className="text-sm font-semibold text-gray-900">What happens next</div>
            <ol className="mt-3 space-y-3 text-sm text-gray-700">
              <li>
                <span className="font-semibold">1) Create the course</span>
                <div className="text-gray-600">You’ll land in the course builder immediately.</div>
              </li>
              <li>
                <span className="font-semibold">2) Build your outline</span>
                <div className="text-gray-600">Add modules, lessons, and reorder them.</div>
              </li>
              <li>
                <span className="font-semibold">3) Add content</span>
                <div className="text-gray-600">Markdown blocks, video, files, and assessments.</div>
              </li>
              <li>
                <span className="font-semibold">4) Publish when ready</span>
                <div className="text-gray-600">Publish modules/lessons and the course itself.</div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>);
}
