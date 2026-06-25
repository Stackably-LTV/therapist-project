import { redirect } from 'next/navigation';
import { createClient, getUser } from '@/components/9a6b39502e62';
export const metadata = {
    title: 'Payment History',
};
export default async function SeekerBillingPage() {
    const user = await getUser();
    if (!user)
        redirect('/login');
    const supabase = await createClient();
    const { data: rawRecords } = await supabase
        .from('billing_transactions')
        .select('id, session_id, charge_amount, currency, payment_status, created_at')
        .eq('payer_id', user.id)
        .order('created_at', { ascending: false });
    const records = rawRecords ?? [];
    // Collect session ids -> fetch sessions -> fetch therapist profile names
    const sessionIds = Array.from(new Set(records.map((r) => r.session_id).filter((id) => Boolean(id))));
    const sessionsById = new Map();
    if (sessionIds.length) {
        const { data: sessions } = await supabase
            .from('appointments')
            .select('id, therapist_id, scheduled_at')
            .in('id', sessionIds);
        for (const s of sessions ?? []) {
            sessionsById.set(s.id, {
                therapist_id: s.therapist_id,
                scheduled_at: s.scheduled_at ?? null,
            });
        }
    }
    const therapistIds = Array.from(new Set(Array.from(sessionsById.values()).map((s) => s.therapist_id)));
    const therapistNameById = new Map();
    if (therapistIds.length) {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', therapistIds);
        for (const p of profiles ?? []) {
            therapistNameById.set(p.user_id, p.full_name || 'Therapist');
        }
    }
    const enriched = records.map((record) => {
        const session = record.session_id ? sessionsById.get(record.session_id) : null;
        return {
            ...record,
            therapistName: session ? therapistNameById.get(session.therapist_id) || 'Therapist' : 'Therapist',
            sessionDate: session?.scheduled_at ?? null,
        };
    });
    const statusStyles = {
        completed: 'bg-green-100 text-green-800',
        pending: 'bg-amber-100 text-amber-800',
        pending_payment: 'bg-amber-100 text-amber-800',
        failed: 'bg-red-100 text-red-800',
        refunded: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-gray-100 text-gray-800',
    };
    return (<div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground mt-1">
          View all your session payments and their status.
        </p>
      </div>

      {enriched.length === 0 ? (<div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground">No payments yet.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Payments will appear here after you book a paid session.
          </p>
        </div>) : (<div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Therapist</th>
                <th className="px-6 py-3">Session</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enriched.map((record) => (<tr key={record.id} className="text-sm">
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(record.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })}
                  </td>
                  <td className="px-6 py-4">{record.therapistName}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {record.sessionDate
                    ? new Date(record.sessionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                    })
                    : '—'}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${Number(record.charge_amount).toFixed(2)} {record.currency?.toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[record.payment_status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {record.payment_status === 'pending_payment'
                    ? 'Processing'
                    : record.payment_status}
                    </span>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>);
}
