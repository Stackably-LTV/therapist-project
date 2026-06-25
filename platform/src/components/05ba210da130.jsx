import Link from 'next/link';
import { ArrowRight, Check, Minus, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { LandingContainer } from '@/components/ed29acce9eae';
import { FAQ } from '@/components/91a66708f281';
import { FinalCta } from '@/components/5b7afff1e2a6';
import { PricingCard, PricingCardsGrid, } from '@/components/864caee029f8';
import { listActiveTiers, } from '@/components/9c79cbbfa8a8';
import { THERAPIST_FEATURE_META, THERAPIST_FEATURES, } from '@/components/18f37321d6fb';
export const metadata = {
    title: 'Pricing for Therapists | Psychlink',
    description: 'Simple monthly plans for therapists. Start with a 7-day free trial. Cancel anytime.',
};
const TRUST_POINTS = [
    {
        icon: ShieldCheck,
        title: 'HIPAA-eligible by design',
        body: 'Encrypted at rest, encrypted in transit. RLS on every table.',
    },
    {
        icon: Wallet,
        title: '7-day free trial',
        body: 'Try every paid feature for a week. No charge until day 8.',
    },
    {
        icon: Sparkles,
        title: 'Upgrade or cancel anytime',
        body: 'Move between tiers in two clicks. Stripe-managed billing.',
    },
];
export default async function MarketingPricingPage() {
    const tiers = await listActiveTiers();
    return (<div className="min-h-screen bg-gradient-to-b from-white via-slate-50/40 to-white">
      <LandingContainer className="py-16 sm:py-24">
        <header className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5"/>
            For licensed therapists
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Simple pricing. Grow at your pace.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start with a 7-day free trial on every plan. Upgrade as your practice grows. Cancel anytime.
          </p>
        </header>

        <section aria-label="Plans" className="mt-12 sm:mt-16">
          <PricingCardsGrid>
            {tiers.map((tier) => (<PricingCard key={tier.id} tier={tier} highlight={tier.code === 't2_practice'} action={{
                label: `Start ${tier.name}`,
                href: `/login?mode=signup&plan=${encodeURIComponent(tier.code)}`,
                variant: tier.code === 't2_practice' ? 'default' : 'outline',
            }} footnote={tier.trialPeriodDays > 0
                ? `No charge for ${tier.trialPeriodDays} days.`
                : undefined}/>))}
          </PricingCardsGrid>
        </section>

        <section aria-label="What you get" className="mt-16 grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-3">
          {TRUST_POINTS.map((point) => (<div key={point.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <point.icon className="h-4 w-4"/>
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{point.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{point.body}</p>
              </div>
            </div>))}
        </section>

        <section aria-label="Compare plans" className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              What&apos;s in each plan
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Features unlock automatically the moment your subscription activates.
            </p>
          </div>

          <ComparisonTable tiers={tiers}/>
        </section>

        <section className="mt-16 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Not sure which plan fits?
          </h2>
          <p className="mt-2 text-gray-600">
            Start with Practice. You can switch any time from your dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login?mode=signup&plan=t2_practice" className="inline-flex h-11 items-center justify-center rounded-md bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
              Start free trial
              <ArrowRight className="ml-2 h-4 w-4"/>
            </Link>
            <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Talk to sales
            </Link>
          </div>
        </section>
      </LandingContainer>

      <FAQ />
      <FinalCta />
    </div>);
}
function ComparisonTable({ tiers }) {
    if (tiers.length === 0)
        return null;
    const gridStyle = {
        gridTemplateColumns: `minmax(0, 1.5fr) repeat(${tiers.length}, minmax(0, 1fr))`,
    };
    return (<div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="grid divide-x divide-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500" style={gridStyle}>
        <div className="px-5 py-4">Feature</div>
        {tiers.map((tier) => (<div key={tier.id} className="px-5 py-4 text-center text-gray-900">
            {tier.name}
          </div>))}
      </div>

      <div className="divide-y divide-gray-100">
        {THERAPIST_FEATURES.map((feature) => {
            const meta = THERAPIST_FEATURE_META[feature];
            return (<div key={feature} className="grid divide-x divide-gray-100 text-sm" style={gridStyle}>
              <div className="px-5 py-4">
                <p className="font-medium text-gray-900">{meta.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{meta.description}</p>
              </div>
              {tiers.map((tier) => (<FeatureCell key={`${tier.id}-${feature}`} included={tier.features.includes(feature)}/>))}
            </div>);
        })}
      </div>
    </div>);
}
function FeatureCell({ included }) {
    return (<div className="flex items-center justify-center px-5 py-4">
      {included ? (<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={3}/>
        </span>) : (<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Minus className="h-4 w-4"/>
        </span>)}
    </div>);
}
