import { redirect } from 'next/navigation';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/30348591d689';
import { Button } from '@/components/2795b661f080';
import { createClient } from '@/components/9a6b39502e62';
import { getTherapistSubscriptionSummary } from '@/components/c5276438fd9f';
import { listActiveTiers } from '@/components/9c79cbbfa8a8';
import { refreshConnectAccountStatus } from '@/components/6383a59c9ee0';
import { PricingCard, PricingCardsGrid, } from '@/components/864caee029f8';
import { THERAPIST_FEATURE_META } from '@/components/18f37321d6fb';
import CancellationQuestionnaireDialog from '@/components/10f95e6fb742';
const ACCESS_STATUSES = new Set(['active', 'trialing', 'past_due']);
function statusLabel(status) {
    if (!status)
        return { text: 'No plan', color: 'bg-gray-100 text-gray-600' };
    const map = {
        active: { text: 'Active', color: 'bg-emerald-100 text-emerald-700' },
        trialing: { text: 'In trial', color: 'bg-blue-100 text-blue-700' },
        past_due: { text: 'Past due', color: 'bg-amber-100 text-amber-700' },
        canceled: { text: 'Canceled', color: 'bg-red-100 text-red-700' },
        incomplete: { text: 'Incomplete', color: 'bg-gray-100 text-gray-600' },
    };
    return map[status] ?? { text: status, color: 'bg-gray-100 text-gray-600' };
}
function flashMessage(checkout, portal, connect) {
    if (checkout === 'success') {
        return {
            tone: 'positive',
            title: 'Payment successful',
            body: 'Your subscription is activating. It usually takes a few seconds.',
        };
    }
    if (checkout === 'cancelled') {
        return {
            tone: 'warning',
            title: 'Checkout cancelled',
            body: 'No changes were made to your subscription.',
        };
    }
    if (portal === 'unavailable') {
        return {
            tone: 'warning',
            title: 'Stripe portal unavailable',
            body: 'You need an active subscription before opening the billing portal.',
        };
    }
    if (connect === 'return') {
        return {
            tone: 'positive',
            title: 'Back from Stripe',
            body: 'Your Stripe Connect details are syncing in the background.',
        };
    }
    if (connect === 'refresh') {
        return {
            tone: 'warning',
            title: 'Connect session expired',
            body: 'Start payout onboarding again below.',
        };
    }
    return null;
}
export default async function TherapistBillingPage({ searchParams, }) {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'therapist') {
        redirect('/login');
    }
    const [summary, tiers, connectRes, params] = await Promise.all([
        getTherapistSubscriptionSummary(user.id),
        listActiveTiers(),
        supabase
            .from('billing_connect_accounts')
            .select('onboarding_status, charges_enabled, payouts_enabled')
            .eq('therapist_id', user.id)
            .maybeSingle(),
        searchParams,
    ]);
    let connectAccount = connectRes.data ?? null;
    // Connected-account status isn't delivered to our platform webhook, so sync it
    // from Stripe whenever a therapist views billing while onboarding is unfinished.
    // This flips them to "completed" right after they return from Stripe — the gate
    // that lets seekers book and money flow to their Connect account.
    if (connectAccount && connectAccount.onboarding_status !== 'completed') {
        const synced = await refreshConnectAccountStatus(user.id);
        if (synced)
            connectAccount = synced;
    }
    const checkoutState = typeof params.checkout === 'string' ? params.checkout : '';
    const portalState = typeof params.portal === 'string' ? params.portal : '';
    const connectState = typeof params.connect === 'string' ? params.connect : '';
    const hasManagedSubscription = summary.status ? ACCESS_STATUSES.has(summary.status) : false;
    const status = statusLabel(summary.status);
    const flash = flashMessage(checkoutState, portalState, connectState);
    return (<div className="space-y-10 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-1 text-gray-500">
          Manage your plan, payment method, and payout settings.
        </p>
      </header>

      {flash && (<div className={`flex items-start gap-3 rounded-xl border px-5 py-4 text-sm ${flash.tone === 'positive'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {flash.tone === 'positive' ? (<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"/>) : (<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"/>)}
          <div>
            <p className="font-semibold">{flash.title}</p>
            <p className="mt-0.5">{flash.body}</p>
          </div>
        </div>)}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Current plan</h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>
                {status.text}
              </span>
            </div>
            {hasManagedSubscription ? (<div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.tierName ?? 'Unknown'}
                  <span className="ml-2 text-base font-normal text-gray-500">
                    ${((summary.priceCents ?? 0) / 100).toFixed(2)}/mo
                  </span>
                </p>
                {summary.currentPeriodEnd && (<p className="mt-1 text-sm text-gray-500">
                    {summary.status === 'trialing' ? 'Trial ends ' : 'Renews '}
                    {new Date(summary.currentPeriodEnd).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })}
                  </p>)}
              </div>) : (<p className="text-sm text-gray-500">
                You don&apos;t have a paid plan yet. Choose one below to unlock features.
              </p>)}
          </div>

          {hasManagedSubscription && (<div className="flex flex-col items-stretch gap-2 sm:items-end">
              <form action="/api/billing/subscription/portal" method="post">
                <Button type="submit" variant="outline" className="h-10 w-full sm:w-auto">
                  Manage payment method
                </Button>
              </form>
              <CancellationQuestionnaireDialog />
            </div>)}
        </div>

        {hasManagedSubscription && summary.features.length > 0 && (<div className="mt-4 flex flex-wrap gap-2">
            {summary.features.map((feature) => {
                const meta = THERAPIST_FEATURE_META[feature];
                return (<span key={feature} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500"/>
                  {meta?.label ?? feature.replace(/_/g, ' ')}
                </span>);
            })}
          </div>)}
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {hasManagedSubscription ? 'Switch your plan' : 'Choose your plan'}
          </h2>
          <p className="mt-1 text-gray-500">
            Every plan starts with a 7-day free trial. Cancel anytime.
          </p>
        </div>

        <PricingCardsGrid>
          {tiers.map((tier) => {
            const isCurrent = summary.tierCode === tier.code && hasManagedSubscription;
            const ctaLabel = isCurrent
                ? 'Manage in Stripe Portal'
                : hasManagedSubscription
                    ? `Switch to ${tier.name}`
                    : `Start ${tier.name}`;
            return (<PricingCard key={tier.id} tier={tier} highlight={tier.code === 't2_practice'} isCurrent={isCurrent} action={{
                    label: ctaLabel,
                    formAction: isCurrent
                        ? '/api/billing/subscription/portal'
                        : '/api/billing/subscription/checkout',
                    hiddenFields: isCurrent ? undefined : { tierCode: tier.code },
                    variant: isCurrent
                        ? 'outline'
                        : tier.code === 't2_practice'
                            ? 'default'
                            : 'outline',
                }}/>);
        })}
        </PricingCardsGrid>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Payouts (Stripe Connect)</h2>
            <p className="text-sm text-gray-500">
              Connect your bank account through Stripe to receive client payments. Stripe handles all KYC, transfers, and automatic daily payouts to your bank.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary" className={`border-0 ${connectAccount?.onboarding_status === 'completed'
            ? 'bg-emerald-100 text-emerald-700'
            : connectAccount?.onboarding_status === 'in_progress'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'}`}>
                {connectAccount?.onboarding_status ?? 'Not started'}
              </Badge>
              {connectAccount && (<>
                  <Badge variant="secondary" className={`border-0 ${connectAccount.charges_enabled
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'}`}>
                    {connectAccount.charges_enabled ? 'Charges enabled' : 'Charges pending'}
                  </Badge>
                  <Badge variant="secondary" className={`border-0 ${connectAccount.payouts_enabled
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'}`}>
                    {connectAccount.payouts_enabled ? 'Payouts enabled' : 'Payouts pending'}
                  </Badge>
                </>)}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <form action="/api/connect/onboarding" method="post">
              <Button type="submit" className="h-10 w-full sm:w-auto">
                {connectAccount?.onboarding_status === 'completed'
            ? 'Update Connect details'
            : connectAccount
                ? 'Continue setup'
                : 'Start payout setup'}
              </Button>
            </form>
            {connectAccount?.onboarding_status === 'completed' && (<form action="/api/connect/dashboard" method="post">
                <Button type="submit" variant="outline" className="h-10 w-full sm:w-auto">
                  Manage payouts in Stripe
                </Button>
              </form>)}
          </div>
        </div>
      </section>
    </div>);
}
