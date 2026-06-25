'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Label } from '@/components/78846397f3ca';
import { Separator } from '@/components/19cc3f2900f4';
import { Badge } from '@/components/30348591d689';
import { FileText, Sparkles, Paperclip, X } from 'lucide-react';
import { FileDropzone } from '@/components/c845945df973';
const MAX_BYTES = 100 * 1024 * 1024;
export function NewCourseForm() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [welcomeFile, setWelcomeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleFile = (file) => {
        if (file.size > MAX_BYTES) {
            setError('File size must be 100MB or less');
            return;
        }
        setError(null);
        setWelcomeFile(file);
    };
    const submit = async () => {
        setError(null);
        const trimmed = title.trim();
        if (!trimmed) {
            setError('Title is required');
            return;
        }
        try {
            setLoading(true);
            const res = await fetch('/api/therapist/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: trimmed,
                    description: description.trim() || null,
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create course');
            const id = data?.course?.id;
            if (!id)
                throw new Error('Missing course id');
            if (welcomeFile) {
                const formData = new FormData();
                formData.set('file', welcomeFile);
                const uploadRes = await fetch(`/api/therapist/courses/${id}/welcome-doc`, {
                    method: 'POST',
                    body: formData,
                });
                const uploadData = await uploadRes.json().catch(() => ({}));
                if (!uploadRes.ok) {
                    throw new Error(uploadData?.error || 'Course created but file upload failed');
                }
            }
            router.push(`/therapist/courses/${id}/edit`);
            router.refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create course');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="rounded-2xl border bg-white overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Course basics</div>
            <div className="mt-1 text-sm text-gray-600">
              You can change everything later. This just creates the course shell.
            </div>
          </div>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
            Draft
          </Badge>
        </div>

        <Separator className="my-6"/>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="course-title">Title</Label>
            <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Anxiety Toolkit — 4 weeks of practical skills" disabled={loading}/>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5"/>
              Keep it outcome-focused. This is what shows on course cards.
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course-description">Description</Label>
            <Textarea id="course-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will a client be able to do after finishing this course?" rows={5} disabled={loading}/>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5"/>
              Tip: 2–4 sentences is plenty. You’ll write lesson content in the builder.
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Welcome resource (optional)</Label>
            {welcomeFile ? (<div className="flex items-center justify-between gap-3 rounded-xl border bg-gray-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                    <Paperclip className="h-4 w-4 text-gray-700"/>
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{welcomeFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(welcomeFile.size / 1024 / 1024).toFixed(2)} MB
                      {welcomeFile.type ? ` · ${welcomeFile.type}` : ''}
                    </div>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setWelcomeFile(null)} disabled={loading} aria-label="Remove file">
                  <X className="h-4 w-4"/>
                </Button>
              </div>) : (<FileDropzone hint="PDF, doc, or image — up to 100MB. Added as the first lesson resource." disabled={loading} onFile={handleFile} accept="application/pdf,image/*,.doc,.docx,.txt,.md"/>)}
            <div className="text-xs text-gray-500">
              We&apos;ll create a “Welcome” module with this file attached so clients see it first.
            </div>
          </div>

          {error ? (<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" onClick={() => router.push('/therapist/courses')} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? 'Creating…' : 'Create & open builder'}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            After creation, you’ll be taken to the builder to add modules, lessons, uploads, and assessments.
          </div>
        </div>
      </div>
    </div>);
}
