'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/2795b661f080';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export function CoursePlayer({ courseId, title, modules, }) {
    const allLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
    const [selectedLessonId, setSelectedLessonId] = useState(allLessons[0]?.id || null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [blocks, setBlocks] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [assessmentAnswers, setAssessmentAnswers] = useState({});
    const [submission, setSubmission] = useState({});
    const [reloadNonce, setReloadNonce] = useState(0);
    const selectedLesson = useMemo(() => {
        if (!selectedLessonId)
            return null;
        return allLessons.find((l) => l.id === selectedLessonId) || null;
    }, [allLessons, selectedLessonId]);
    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!selectedLessonId)
                return;
            setLoading(true);
            setContentLoading(true);
            setError(null);
            try {
                const [videoRes, lessonRes] = await Promise.all([
                    fetch(`/api/courses/${courseId}/lessons/${selectedLessonId}/video-url`, { method: 'GET' }),
                    fetch(`/api/courses/${courseId}/lessons/${selectedLessonId}`, { method: 'GET' }),
                ]);
                const videoJson = await videoRes.json();
                if (!videoRes.ok)
                    throw new Error(videoJson?.error || 'Failed to load video URL');
                const signed = videoJson?.signedUrl || null;
                const lessonJson = await lessonRes.json();
                if (!lessonRes.ok)
                    throw new Error(lessonJson?.error || 'Failed to load lesson content');
                const lesson = lessonJson?.lesson;
                const nextBlocks = (lesson?.blocks ?? []);
                const nextAssessments = (lesson?.assessments ?? []);
                if (!mounted)
                    return;
                setVideoUrl(signed);
                setBlocks(nextBlocks.slice().sort((a, b) => a.position - b.position));
                setAssessments(nextAssessments
                    .slice()
                    .map((a) => ({
                    ...a,
                    questions: (a.questions ?? [])
                        .slice()
                        .sort((x, y) => x.position - y.position)
                        .map((q) => ({
                        ...q,
                        options: (q.options ?? []).slice().sort((x, y) => x.position - y.position),
                    })),
                })));
            }
            catch (e) {
                if (!mounted)
                    return;
                setVideoUrl(null);
                setBlocks([]);
                setAssessments([]);
                setError(e instanceof Error ? e.message : 'Failed to load video');
            }
            finally {
                if (mounted) {
                    setLoading(false);
                    setContentLoading(false);
                }
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [courseId, selectedLessonId, reloadNonce]);
    const markdownBlocks = useMemo(() => blocks.filter((b) => b.type === 'markdown'), [blocks]);
    return (<div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {selectedLesson ? (<p className="mt-1 text-sm text-gray-600">Now playing: {selectedLesson.title}</p>) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Lessons</div>
          <div className="mt-3 space-y-4">
            {modules.map((m) => (<div key={m.id}>
                <div className="text-sm font-medium text-gray-800">{m.title}</div>
                <div className="mt-2 space-y-1">
                  {m.lessons.map((l) => {
                const active = l.id === selectedLessonId;
                return (<button key={l.id} className={[
                        'w-full rounded-md px-3 py-2 text-left text-sm transition',
                        active ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700',
                    ].join(' ')} onClick={() => setSelectedLessonId(l.id)}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{l.title}</span>
                          {l.isPreview ? (<span className="shrink-0 text-[11px] font-medium text-gray-500">
                              Preview
                            </span>) : null}
                        </div>
                      </button>);
            })}
                </div>
              </div>))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            {loading ? (<div className="flex h-[420px] items-center justify-center text-sm text-gray-600">Loading…</div>) : error ? (<div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center">
                <div className="text-sm font-medium text-gray-900">Could not load lesson</div>
                <div className="max-w-md text-sm text-gray-600">{error}</div>
                <Button variant="outline" onClick={() => setReloadNonce((n) => n + 1)}>
                  Retry
                </Button>
              </div>) : videoUrl ? (<video key={videoUrl} controls className="aspect-video w-full rounded-lg bg-black" src={videoUrl}/>) : (<div className="flex h-[420px] items-center justify-center text-sm text-gray-600">No video for this lesson.</div>)}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <div className="text-sm font-semibold text-gray-900">Lesson notes</div>
            {contentLoading ? (<div className="mt-3 text-sm text-gray-600">Loading content…</div>) : markdownBlocks.length === 0 ? (<div className="mt-3 text-sm text-gray-600">No lesson content yet.</div>) : (<div className="prose prose-sm mt-4 max-w-none">
                {markdownBlocks.map((b) => (<ReactMarkdown key={b.id} remarkPlugins={[remarkGfm]}>
                    {String(b.payload?.markdown ?? '')}
                  </ReactMarkdown>))}
              </div>)}
          </div>

          {assessments.length > 0 ? (<div className="rounded-xl border bg-white p-5">
              <div className="text-sm font-semibold text-gray-900">Quiz</div>
              <div className="mt-1 text-xs text-gray-600">Answer the questions, then submit to see your score.</div>

              <div className="mt-4 space-y-6">
                {assessments.map((a) => {
                const perAssessment = assessmentAnswers[a.id] ?? {};
                const result = submission[a.id] ?? null;
                return (<div key={a.id} className="rounded-lg border bg-gray-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium text-gray-900">{a.title}</div>
                        <div className="text-xs text-gray-600">
                          Passing: {a.passing_score ?? '—'}%
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        {a.questions.map((q) => (<div key={q.id} className="rounded-md bg-white p-3">
                            <div className="text-sm font-medium text-gray-900">{q.prompt}</div>
                            <div className="mt-2 space-y-2">
                              {q.options.map((o) => (<label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                  <input type="radio" name={`${a.id}:${q.id}`} checked={perAssessment[q.id] === o.id} onChange={() => setAssessmentAnswers((prev) => ({
                                ...prev,
                                [a.id]: { ...(prev[a.id] ?? {}), [q.id]: o.id },
                            }))}/>
                                  <span>{o.label}</span>
                                </label>))}
                            </div>
                          </div>))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        {result ? (<div className="text-sm text-gray-700">
                            Score: <span className="font-semibold">{result.score ?? '—'}</span>
                            {result.passed === null ? null : (<span className="ml-2">{result.passed ? 'Passed' : 'Not passed'}</span>)}
                          </div>) : (<div className="text-sm text-gray-600">Not submitted yet.</div>)}

                        <Button onClick={async () => {
                        try {
                            const answers = Object.entries(perAssessment).map(([questionId, optionId]) => ({
                                questionId,
                                optionId,
                            }));
                            const res = await fetch(`/api/courses/${courseId}/assessments/${a.id}/submit`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ answers }),
                            });
                            const data = await res.json();
                            if (!res.ok)
                                throw new Error(data?.error || 'Failed to submit');
                            const sub = data?.submission;
                            setSubmission((prev) => ({
                                ...prev,
                                [a.id]: { score: sub?.score ?? null, passed: sub?.passed ?? null },
                            }));
                        }
                        catch (e) {
                            setError(e instanceof Error ? e.message : 'Failed to submit assessment');
                        }
                    }}>
                          Submit
                        </Button>
                      </div>
                    </div>);
            })}
              </div>
            </div>) : null}
        </div>
      </div>
    </div>);
}
