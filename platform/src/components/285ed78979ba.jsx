import { redirect } from 'next/navigation';
import { CreditCard, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/components/9a6b39502e62';
import { listCancellationRequests } from '@/components/4c1649935362';
import { CANCELLATION_QUESTIONS, labelForAnswer } from '@/components/03f345984aa7';
import CancellationRequestActions from '@/components/c3289778d8c4';
function formatDate(value) {
    if (!value)
        return '—';
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
const STATUS_BADGE = {
    pending: { text: 'Pending review', className: 'bg-amber-100 text-amber-700' },
    completed: { text: 'Cancelled', className: 'bg-red-100 text-red-700' },
    dismissed: { text: 'Kept (dismissed)', className: 'bg-gray-100 text-gray-600' },
};
export default async function AdminCancellationsPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'admin')
        redirect('/login');
    const result = await listCancellationRequests();
    const requests = result.ok ? result.data : [];
    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    return (<div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <CreditCard className="h-7 w-7 text-gray-400"/>
          Cancellation requests
        </h1>
        <p className="text-gray-500">
          Therapists who asked to cancel. Review their feedback, cancel the subscription in the
          Stripe dashboard, then mark the request as cancelled. {pendingCount} pending.
        </p>
      </header>

      {requests.length === 0 && (<div className="rounded-2xl border border-dashed bg-white py-16 text-center text-gray-500">
          No cancellation requests yet.
        </div>)}

      <div className="space-y-6">
        {requests.map((req) => {
            const badge = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending;
            return (<article key={req.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{req.therapistName}</p>
                  <p className="text-sm text-gray-500">{req.therapistEmail}</p>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {badge.text}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3"/> {formatDate(req.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-2 border-b px-6 py-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Plan</p>
                  <p className="font-medium text-gray-800">{req.tierName ?? '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Stripe subscription ID
                  </p>
                  <p className="font-mono text-xs text-gray-800">
                    {req.stripeSubscriptionId ?? '— (none on file)'}
                  </p>
                </div>
              </div>

              {/* All questionnaire answers */}
              <div className="space-y-4 px-6 py-5">
                {CANCELLATION_QUESTIONS.map((q) => {
                    const answer = req.responses[q.id];
                    const text = labelForAnswer(q, answer);
                    return (<div key={q.id}>
                      <p className="text-xs font-medium text-gray-500">{q.prompt}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">{text}</p>
                    </div>);
                })}
              </div>

              <div className="border-t bg-gray-50 px-6 py-4">
                {req.status === 'pending' ? (<CancellationRequestActions requestId={req.id}/>) : (<div className="flex items-start gap-2 text-sm text-gray-600">
                    {req.status === 'completed' ? (<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500"/>) : (<XCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"/>)}
                    <div>
                      <p>Processed {formatDate(req.processedAt)}.</p>
                      {req.adminNotes && (<p className="mt-0.5 text-gray-500">Note: {req.adminNotes}</p>)}
                    </div>
                  </div>)}
              </div>
            </article>);
        })}
      </div>
    </div>);
}
