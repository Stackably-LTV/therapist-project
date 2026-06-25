'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ba221113eac7';
import { Button } from '@/components/2795b661f080';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Input } from '@/components/c2f62fb0cb5e';
import { CANCELLATION_QUESTIONS, validateResponses, } from '@/components/03f345984aa7';
export default function CancellationQuestionnaireDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    function setAnswer(id, value) {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    }
    function toggleMulti(id, value) {
        setAnswers((prev) => {
            const current = Array.isArray(prev[id]) ? prev[id] : [];
            const next = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            return { ...prev, [id]: next };
        });
    }
    function isMissing(q) {
        if (!q.required)
            return false;
        const a = answers[q.id];
        if (q.type === 'multi')
            return !Array.isArray(a) || a.length === 0;
        return !a || (typeof a === 'string' && a.trim() === '');
    }
    async function handleSubmit() {
        const validation = validateResponses(answers);
        if (!validation.ok) {
            setShowErrors(true);
            toast.error('Please answer every required question before submitting.');
            // Scroll to first unanswered question.
            const firstMissing = CANCELLATION_QUESTIONS.find(isMissing);
            if (firstMissing) {
                document.getElementById(`q-${firstMissing.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/billing/subscription/cancellation-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses: validation.responses }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error || 'Could not submit your request.');
                setSubmitting(false);
                return;
            }
            toast.success('Your cancellation request has been submitted for review.');
            setOpen(false);
            router.refresh();
        }
        catch {
            toast.error('Network error. Please try again.');
            setSubmitting(false);
        }
    }
    const answeredCount = CANCELLATION_QUESTIONS.filter((q) => !isMissing(q)).length;
    const requiredCount = CANCELLATION_QUESTIONS.filter((q) => q.required).length;
    return (<Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-10 text-red-600 hover:bg-red-50 hover:text-red-700">
          Cancel subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-xl">Before you cancel</DialogTitle>
          <DialogDescription>
            Cancelling is handled personally by our team. Please answer the questions below — your
            feedback genuinely shapes the product, and we&apos;ll process your cancellation within 2
            business days.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-7 overflow-y-auto px-6 py-6">
          {CANCELLATION_QUESTIONS.map((q, index) => {
            const missing = showErrors && isMissing(q);
            return (<fieldset key={q.id} id={`q-${q.id}`} className="space-y-3">
                <legend className="text-sm font-semibold text-gray-900">
                  <span className="mr-1.5 text-gray-400">{index + 1}.</span>
                  {q.prompt}
                  {q.required && <span className="ml-1 text-red-500">*</span>}
                </legend>
                {q.helper && <p className="-mt-1 text-xs text-gray-500">{q.helper}</p>}

                {q.type === 'single' && (<div className="space-y-2">
                    {q.options.map((opt) => (<label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:border-gray-300 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                        <input type="radio" name={q.id} value={opt.value} checked={answers[q.id] === opt.value} onChange={() => setAnswer(q.id, opt.value)} className="h-4 w-4 accent-gray-900"/>
                        {opt.label}
                      </label>))}
                  </div>)}

                {q.type === 'multi' && (<div className="space-y-2">
                    {q.options.map((opt) => {
                        const checked = Array.isArray(answers[q.id]) &&
                            answers[q.id].includes(opt.value);
                        return (<label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:border-gray-300 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                          <input type="checkbox" checked={checked} onChange={() => toggleMulti(q.id, opt.value)} className="h-4 w-4 accent-gray-900"/>
                          {opt.label}
                        </label>);
                    })}
                  </div>)}

                {q.type === 'scale' && (<div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: (q.max ?? 0) - (q.min ?? 0) + 1 }, (_, i) => {
                        const val = String((q.min ?? 0) + i);
                        const active = answers[q.id] === val;
                        return (<button key={val} type="button" onClick={() => setAnswer(q.id, val)} className={`h-10 w-10 rounded-lg border text-sm font-medium transition ${active
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                            {val}
                          </button>);
                    })}
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                      <span>{q.minLabel}</span>
                      <span>{q.maxLabel}</span>
                    </div>
                  </div>)}

                {q.type === 'text' &&
                    (q.multiline ? (<Textarea rows={3} placeholder={q.placeholder} value={answers[q.id] ?? ''} onChange={(e) => setAnswer(q.id, e.target.value)}/>) : (<Input placeholder={q.placeholder} value={answers[q.id] ?? ''} onChange={(e) => setAnswer(q.id, e.target.value)}/>))}

                {missing && (<p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3"/> This question is required.
                  </p>)}
              </fieldset>);
        })}
        </div>

        <DialogFooter className="flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-500">
            {answeredCount}/{requiredCount} required answered
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Keep my plan
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Submit cancellation request
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
