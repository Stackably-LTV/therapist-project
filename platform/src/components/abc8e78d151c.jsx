import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarClock, CreditCard, FileCheck2, TrendingUp, AlertTriangle } from 'lucide-react';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { US_STATES } from '@/components/96fabadae962';
import RejectTherapistModal from '@/components/27e2879ca595';
const SUBSCRIPTION_STATUS_STYLES = {
    active: 'bg-emerald-100 text-emerald-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-amber-100 text-amber-700',
    incomplete: 'bg-gray-100 text-gray-700',
    canceled: 'bg-red-100 text-red-700',
};
function formatCurrency(cents) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(cents / 100);
}
function formatDate(value) {
    if (!value)
        return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatPhone(e164) {
    if (!e164)
        return '';
    const digits = e164.replace(/\D/g, '');
    const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (national.length === 10) {
        return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
    }
    return e164;
}
function stateLabels(codes) {
    if (!Array.isArray(codes) || codes.length === 0)
        return '';
    return codes
        .map((code) => US_STATES.find((s) => s.value === code)?.label || String(code))
        .join(', ');
}
function statusLabel(status) {
    if (!status)
        return 'No subscription';
    const map = {
        active: 'Active',
        trialing: 'On trial',
        past_due: 'Past due',
        incomplete: 'Awaiting payment',
        canceled: 'Canceled',
    };
    return map[status] ?? status;
}
export default async function ApprovalsPage() {
    const supabase = await createClient();
    const nowMs = Date.now();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: profile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (profile?.role !== 'admin') {
        redirect('/');
    }
    const { data: pendingRoleRows } = await supabase
        .from('user_roles')
        .select('id, role, status, created_at')
        .eq('role', 'therapist')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    const pendingIds = (pendingRoleRows ?? []).map((r) => r.id);
    const [{ data: pendingProfileRows }, { data: pendingSubRows }, { data: allSubsRows }] = await Promise.all([
        pendingIds.length
            ? supabase
                .from('user_profiles')
                .select('user_id, full_name, bio, phone_e164, license_number, licensed_states, specialties, rate, profile_image_url, years_experience, onboarding_completed')
                .in('user_id', pendingIds)
            : Promise.resolve({ data: [] }),
        pendingIds.length
            ? supabase
                .from('billing_subscriptions')
                .select('therapist_id, status, current_period_end, cancel_at_period_end, stripe_subscription_id, tier:billing_tiers(code, name, price_cents)')
                .in('therapist_id', pendingIds)
            : Promise.resolve({ data: [] }),
        supabase
            .from('billing_subscriptions')
            .select('status, tier:billing_tiers(price_cents)')
            .in('status', ['active', 'trialing', 'past_due']),
    ]);
    const pendingProfileById = new Map();
    pendingProfileRows?.forEach((p) => pendingProfileById.set(p.user_id, p));
    const pendingSubById = new Map();
    pendingSubRows?.forEach((s) => {
        const sub = s;
        const rawTier = sub.tier;
        const tier = Array.isArray(rawTier)
            ? (rawTier[0] ?? null)
            : (rawTier ?? null);
        pendingSubById.set(sub.therapist_id, {
            status: sub.status,
            current_period_end: sub.current_period_end ?? null,
            cancel_at_period_end: Boolean(sub.cancel_at_period_end),
            stripe_subscription_id: sub.stripe_subscription_id ?? null,
            tier,
        });
    });
    const serviceClient = createServiceRoleClient();
    // Emails come from auth.users (service-role only).
    const emailById = new Map();
    try {
        const { data: authList } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        for (const u of authList?.users ?? []) {
            if (u.email)
                emailById.set(u.id, u.email);
        }
    }
    catch (e) {
        console.error('[ApprovalsPage] listUsers error', e);
    }
    // Count uploaded credential documents (license/resume/certifications) per applicant.
    const credentialCountById = new Map();
    if (pendingIds.length) {
        const { data: credRows } = await serviceClient
            .from('file_uploads')
            .select('owner_id')
            .eq('type', 'credential')
            .in('owner_id', pendingIds);
        for (const row of credRows ?? []) {
            const id = row.owner_id;
            credentialCountById.set(id, (credentialCountById.get(id) ?? 0) + 1);
        }
    }
    const pendingTherapists = (pendingRoleRows ?? []).map((r) => {
        const p = pendingProfileById.get(r.id);
        return {
            id: r.id,
            role: r.role,
            status: r.status,
            created_at: r.created_at,
            name: p?.full_name ?? '',
            email: emailById.get(r.id) ?? '',
            phone: p?.phone_e164 ?? '',
            onboarding_completed: Boolean(p?.onboarding_completed),
            credential_count: credentialCountById.get(r.id) ?? 0,
            profile_json: {
                bio: p?.bio ?? undefined,
                license_number: p?.license_number ?? undefined,
                licensed_states: p?.licensed_states ?? undefined,
                specialties: p?.specialties ?? undefined,
                rate: p?.rate ?? undefined,
                profile_image_url: p?.profile_image_url ?? undefined,
                years_experience: p?.years_experience ?? undefined,
            },
            subscription: pendingSubById.get(r.id) ?? null,
        };
    });
    const readyForReview = pendingTherapists.filter((t) => t.onboarding_completed);
    const incompleteSignups = pendingTherapists.filter((t) => !t.onboarding_completed);
    // MRR + trial count, computed over all active/trialing subscriptions (not just the pending ones).
    // Supabase types the joined `tier` as an array; take the first element.
    const mrrCents = (allSubsRows ?? []).reduce((acc, row) => {
        const r = row;
        if (r.status === 'active' || r.status === 'past_due') {
            const tier = Array.isArray(r.tier) ? r.tier[0] : r.tier;
            return acc + (tier?.price_cents ?? 0);
        }
        return acc;
    }, 0);
    const trialingCount = (allSubsRows ?? []).filter((row) => row.status === 'trialing').length;
    return (<div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Therapist Approvals</h1>
        <p className="mt-2 text-gray-600">Review applications and approve trusted licensed therapists.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={FileCheck2} tone="amber" label="Ready to review" value={readyForReview.length}/>
        <StatCard icon={CalendarClock} tone="rose" label=">2 days old" value={readyForReview.filter((t) => {
            const days = Math.floor((nowMs - new Date(t.created_at).getTime()) / 86_400_000);
            return days > 2;
        }).length}/>
        <StatCard icon={TrendingUp} tone="emerald" label="Active MRR (paid)" value={formatCurrency(mrrCents)}/>
        <StatCard icon={CreditCard} tone="indigo" label="In trial" value={trialingCount}/>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Ready to review ({readyForReview.length})
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Applicants who finished onboarding. Open a profile to view their license and uploaded documents before deciding.
          </p>
        </div>

        {readyForReview.length === 0 ? (<div className="px-6 py-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="mt-2">No applications ready for review</p>
            <p className="text-sm text-gray-400 mt-1">Completed applications will appear here</p>
          </div>) : (<div className="divide-y divide-gray-200">
            {readyForReview.map((therapist) => {
                const profileData = therapist.profile_json;
                const sub = therapist.subscription;
                const daysSinceCreated = Math.floor((nowMs - new Date(therapist.created_at).getTime()) / 86_400_000);
                const isUrgent = daysSinceCreated > 2;
                const states = stateLabels(profileData.licensed_states);
                return (<div key={therapist.id} className={`px-6 py-6 ${isUrgent ? 'bg-yellow-50/50' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{therapist.name || 'Unnamed therapist'}</h3>
                          <p className="text-sm text-gray-500">{therapist.email || '—'}</p>
                          {therapist.phone ? (<p className="text-sm text-gray-500">{formatPhone(therapist.phone)}</p>) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                            Onboarding complete
                          </span>
                          {isUrgent && (<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                              {daysSinceCreated} days old
                            </span>)}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Subscription
                          </p>
                          {sub ? (<div className="mt-2 space-y-1.5 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {sub.tier?.name ?? 'Unknown tier'}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${SUBSCRIPTION_STATUS_STYLES[sub.status] ??
                            'bg-gray-100 text-gray-600'}`}>
                                  {statusLabel(sub.status)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {sub.tier ? formatCurrency(sub.tier.price_cents) + '/mo' : '—'}
                                {sub.current_period_end ? (<>
                                    {' · '}
                                    {sub.status === 'trialing' ? 'Trial ends ' : 'Renews '}
                                    {formatDate(sub.current_period_end)}
                                  </>) : null}
                              </p>
                              {sub.cancel_at_period_end && (<p className="text-xs text-amber-700">Cancels at period end</p>)}
                            </div>) : (<p className="mt-2 text-sm text-gray-500">No subscription on file yet</p>)}
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            License & practice
                          </p>
                          <dl className="mt-2 space-y-1 text-sm">
                            {profileData.license_number ? (<Row label="License" value={profileData.license_number}/>) : null}
                            {states ? <Row label="Licensed in" value={states}/> : null}
                            {profileData.years_experience !== undefined ? (<Row label="Experience" value={`${profileData.years_experience} years`}/>) : null}
                            {profileData.rate ? (<Row label="Rate" value={`$${profileData.rate}/hour`}/>) : null}
                            <Row label="Documents" value={therapist.credential_count > 0
                        ? `${therapist.credential_count} uploaded`
                        : 'None uploaded'}/>
                            <Row label="Applied" value={formatDate(therapist.created_at)}/>
                          </dl>
                        </div>
                      </div>

                      {Array.isArray(profileData.specialties) && profileData.specialties.length > 0 && (<div className="mt-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Specialties
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {profileData.specialties.map((spec) => (<span key={spec} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                {spec}
                              </span>))}
                          </div>
                        </div>)}

                      {profileData.bio ? (<div className="mt-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Bio
                          </span>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-3">{profileData.bio}</p>
                        </div>) : null}
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <Link href={`/admin/therapists/${therapist.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium text-center">
                        View full profile &amp; documents
                      </Link>
                      <form action="/api/admin/approve-therapist" method="POST">
                        <input type="hidden" name="therapistId" value={therapist.id}/>
                        <button type="submit" className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium">
                          Approve
                        </button>
                      </form>
                      <RejectTherapistModal therapistId={therapist.id}/>
                    </div>
                  </div>
                </div>);
            })}
          </div>)}
      </div>

      {incompleteSignups.length > 0 && (<div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5 text-amber-500"/>
              Incomplete signups ({incompleteSignups.length})
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              These people started signing up but never finished onboarding, so they haven&apos;t submitted a license,
              specialties, or documents yet. There&apos;s nothing to verify until they complete their application —
              you can leave them, or remove them to clear the queue.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {incompleteSignups.map((therapist) => {
                const sub = therapist.subscription;
                return (<div key={therapist.id} className="px-6 py-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {therapist.name || 'Unnamed therapist'}
                        </h3>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                          Incomplete signup
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                        <p>{therapist.email || 'No email on file'}</p>
                        <p>{therapist.phone ? formatPhone(therapist.phone) : 'No phone on file'}</p>
                        <p className="text-xs text-gray-400">
                          Started {formatDate(therapist.created_at)} ·{' '}
                          {sub
                        ? `Subscription ${statusLabel(sub.status).toLowerCase()}`
                        : 'No subscription started'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <Link href={`/admin/therapists/${therapist.id}`} className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-center">
                        View profile
                      </Link>
                      <RejectTherapistModal therapistId={therapist.id}/>
                    </div>
                  </div>
                </div>);
            })}
          </div>
        </div>)}
    </div>);
}
function Row({ label, value }) {
    return (<div className="flex gap-2 text-sm">
      <dt className="font-medium text-gray-700">{label}:</dt>
      <dd className="text-gray-600">{value}</dd>
    </div>);
}
const TONE_STYLES = {
    amber: { ring: 'ring-amber-100', bg: 'bg-amber-50/50', iconBg: 'bg-amber-100', iconFg: 'text-amber-700', valueFg: 'text-amber-700' },
    rose: { ring: 'ring-rose-100', bg: 'bg-rose-50/50', iconBg: 'bg-rose-100', iconFg: 'text-rose-700', valueFg: 'text-rose-700' },
    emerald: { ring: 'ring-emerald-100', bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-100', iconFg: 'text-emerald-700', valueFg: 'text-emerald-700' },
    indigo: { ring: 'ring-indigo-100', bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-100', iconFg: 'text-indigo-700', valueFg: 'text-indigo-700' },
};
function StatCard({ icon: Icon, tone, label, value, }) {
    const styles = TONE_STYLES[tone];
    return (<div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ${styles.ring}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconFg}`}>
          <Icon className="h-4 w-4"/>
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${styles.valueFg}`}>{value}</p>
    </div>);
}
