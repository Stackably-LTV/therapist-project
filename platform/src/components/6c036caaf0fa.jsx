import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import Link from 'next/link';
import { Badge } from '@/components/30348591d689';
function formatKeyLabel(key) {
    const withSpaces = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
export default async function SeekerChartDetailPage({ params, }) {
    const { chartId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: profileRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (!profileRow || profileRow.role !== 'seeker') {
        redirect('/login');
    }
    const { data: chart } = await supabase
        .from('clinical_charts')
        .select('id, title, chart_type, content, status, assigned_at, created_at, therapist_id')
        .eq('id', chartId)
        .eq('seeker_id', user.id)
        .eq('is_shared', true)
        .in('status', ['assigned', 'completed', 'reviewed'])
        .maybeSingle();
    if (!chart)
        notFound();
    const { data: therapistProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', chart.therapist_id)
        .single();
    const therapistName = therapistProfile?.full_name;
    const fields = chart.content?.fields ?? null;
    const textFallback = chart.content?.text ?? null;
    const entries = fields
        ? Object.entries(fields).filter(([, value]) => {
            if (typeof value === 'boolean')
                return true;
            if (typeof value === 'string')
                return value.trim().length > 0;
            return value != null;
        })
        : [];
    return (<div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-4">
        <Link href="/seeker/chart" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 hover:text-gray-700">
          Back to My Chart
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="border-b border-gray-200 pb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Clinical chart</div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{chart.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {therapistName ? `By ${therapistName} · ` : ''}
            {chart.assigned_at ? new Date(chart.assigned_at).toLocaleDateString() : new Date(chart.created_at).toLocaleDateString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{chart.chart_type.replace('_', ' ')}</Badge>
            <Badge variant={chart.status === 'completed' || chart.status === 'reviewed' ? 'default' : 'outline'}>
              {chart.status}
            </Badge>
          </div>
        </div>

        <div className="mt-6">
          {entries.length > 0 ? (<div className="grid gap-3 sm:grid-cols-2">
              {entries.map(([key, value]) => (<div key={key} className="rounded-lg border border-gray-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                    {formatKeyLabel(key)}
                  </p>
                  <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </p>
                </div>))}
            </div>) : textFallback ? (<p className="text-sm text-gray-700 whitespace-pre-wrap">{textFallback}</p>) : (<p className="text-sm text-gray-500">No details available.</p>)}
        </div>
      </div>
    </div>);
}
