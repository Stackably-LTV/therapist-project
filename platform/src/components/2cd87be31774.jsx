'use client';
import { useEffect, useState } from 'react';
import { Check, Lock, Sparkles, Gift } from 'lucide-react';
import { cn } from '@/components/98e56006aa84';
import { THERAPIST_FEATURE_META, } from '@/components/18f37321d6fb';
import { formatTierPrice, } from '@/components/8c48aa284994';
const TIER_THEMES = {
    t1_essentials: {
        accentBar: 'from-slate-400 to-slate-600',
        text: 'text-slate-900',
        ring: 'ring-slate-900',
        checkBg: 'bg-slate-100',
        checkFg: 'text-slate-700',
        selectedBg: 'bg-slate-900 text-white',
    },
    t2_practice: {
        accentBar: 'from-indigo-500 via-violet-500 to-fuchsia-500',
        text: 'text-indigo-700',
        ring: 'ring-indigo-500',
        checkBg: 'bg-indigo-100',
        checkFg: 'text-indigo-700',
        selectedBg: 'bg-indigo-600 text-white',
    },
    t3_pro: {
        accentBar: 'from-violet-500 to-purple-700',
        text: 'text-violet-700',
        ring: 'ring-violet-500',
        checkBg: 'bg-violet-100',
        checkFg: 'text-violet-700',
        selectedBg: 'bg-violet-600 text-white',
    },
};
const DEFAULT_THEME = TIER_THEMES.t1_essentials;
// Illustrative client-request activity shown during onboarding to convey live demand.
// These are NOT real people — no real client PII is ever exposed here.
const LIVE_REQUESTS = [
    { name: 'Jessica R.', focus: 'Anxiety & stress', ago: '2 min ago' },
    { name: 'Marcus T.', focus: 'Depression', ago: '6 min ago' },
    { name: 'Priya S.', focus: 'Couples therapy', ago: 'just now' },
    { name: 'David L.', focus: 'Trauma & PTSD', ago: '4 min ago' },
    { name: 'Aaliyah M.', focus: 'Life transitions', ago: '11 min ago' },
];
export default function TherapistPlanPickerStep({ tiers, selectedCode, onSelect, isSubmitting, error, }) {
    const trialDays = tiers[0]?.trialPeriodDays ?? 7;
    const [liveIdx, setLiveIdx] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setLiveIdx((i) => (i + 1) % LIVE_REQUESTS.length), 3500);
        return () => clearInterval(t);
    }, []);
    const liveReq = LIVE_REQUESTS[liveIdx];
    return (<div className="space-y-5">
      {/* Loud trial banner — the single most important thing on this page. */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-white shadow-sm sm:px-5 sm:py-4">
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
            <Gift className="h-5 w-5"/>
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight sm:text-lg">
              {trialDays} days free — $0 charged today
            </p>
            <p className="mt-0.5 text-xs text-emerald-50 sm:text-sm">
              We only bill you after your {trialDays}-day trial ends. Cancel anytime, no questions asked.
            </p>
          </div>
        </div>
      </div>

      {/* Live client-request ticker — illustrative activity (no real client PII). */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white px-4 py-3">
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"/>
          </span>
          Live
        </span>
        <div className="flex items-center gap-3 pr-12">
          <span className="relative inline-block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/winback/client-blur.jpg" alt="" aria-hidden className="h-full w-full object-cover" style={{ filter: `hue-rotate(${liveIdx * 47}deg)`, transform: 'scale(1.15)' }}/>
          </span>
          {/* key forces a remount on each rotation so the text visibly refreshes */}
          <div key={liveIdx} className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              <span aria-hidden className="select-none" style={{ filter: 'blur(5px)' }}>
                {liveReq.name}
              </span>{' '}
              is looking for a therapist right now
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              <span aria-hidden className="select-none" style={{ filter: 'blur(4px)' }}>
                {liveReq.focus}
              </span>{' '}
              · {liveReq.ago}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Pick your plan</h2>
        <p className="text-sm text-muted-foreground">
          Every plan starts with a {trialDays}-day free trial. Cancel anytime.
        </p>
      </div>

      {error && (<div role="alert" className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-800">
          {error}
        </div>)}

      <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
            const theme = TIER_THEMES[tier.code] ?? DEFAULT_THEME;
            const isSelected = selectedCode === tier.code;
            const isPopular = Boolean(tier.badge);
            return (<button key={tier.id} type="button" onClick={() => onSelect(tier.code)} disabled={isSubmitting} aria-pressed={isSelected} className={cn('group relative flex h-full flex-col rounded-xl bg-white text-left transition-all duration-150', 'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1', isSelected
                    ? `border-transparent ring-2 ${theme.ring} shadow-sm`
                    : 'border-gray-200 hover:border-gray-300', isSubmitting && 'opacity-70')}>
              <span aria-hidden className={cn('h-1 w-full shrink-0 rounded-t-xl bg-gradient-to-r', theme.accentBar)}/>

              <span aria-hidden className={cn('absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full transition-all', isSelected
                    ? `${theme.selectedBg} opacity-100`
                    : 'border border-gray-200 bg-white opacity-0')}>
                <Check className="h-3 w-3" strokeWidth={3}/>
              </span>

              <div className="flex flex-1 flex-col p-4">
                {/* Fixed-height badge row so all 3 cards align */}
                <div className="mb-1.5 flex h-5 items-center">
                  {isPopular && (<span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                      <Sparkles className="h-2.5 w-2.5"/>
                      {tier.badge}
                    </span>)}
                </div>

                <h3 className={cn('text-sm font-semibold pr-7', theme.text)}>{tier.name}</h3>
                <p className="mt-0.5 min-h-[2.5rem] text-xs text-gray-500 line-clamp-2">
                  {tier.tagline ?? ''}
                </p>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight text-gray-900">
                    {formatTierPrice(tier)}
                  </span>
                  <span className="text-xs text-gray-500">/mo</span>
                </div>

                <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1 w-1 rounded-full bg-emerald-500"/>
                  {tier.trialPeriodDays}-day trial
                </span>

                <ul className="mt-3 space-y-1.5">
                  {tier.features.slice(0, 3).map((feature) => {
                    const meta = THERAPIST_FEATURE_META[feature];
                    return (<li key={feature} className="flex items-start gap-1.5">
                        <span className={cn('mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full', theme.checkBg)}>
                          <Check className={cn('h-2 w-2', theme.checkFg)} strokeWidth={4}/>
                        </span>
                        <span className="text-xs leading-snug text-gray-700">
                          {meta?.label ?? feature}
                        </span>
                      </li>);
                })}
                  {tier.features.length > 3 && (<li className="pl-[18px]">
                      <span className="relative inline-block group/more">
                        <span className="cursor-help text-[11px] font-medium text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-900">
                          + {tier.features.length - 3} more · hover to see all
                        </span>
                        {/* Hover popover with the full feature list. Pointer-events-none so it doesn't swallow the parent button's click. */}
                        <span className="pointer-events-none invisible absolute left-0 top-full z-20 mt-1.5 block w-56 -translate-y-1 opacity-0 transition-all group-hover/more:visible group-hover/more:translate-y-0 group-hover/more:opacity-100 group-focus-within/more:visible group-focus-within/more:translate-y-0 group-focus-within/more:opacity-100">
                          <span className="block rounded-lg border border-gray-200 bg-white p-3 text-left shadow-xl ring-1 ring-black/5">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                              Everything in {tier.name}
                            </span>
                            <span className="block space-y-1">
                              {tier.features.map((feature) => {
                        const meta = THERAPIST_FEATURE_META[feature];
                        return (<span key={feature} className="flex items-start gap-1.5">
                                    <span className={cn('mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full', theme.checkBg)}>
                                      <Check className={cn('h-2 w-2', theme.checkFg)} strokeWidth={4}/>
                                    </span>
                                    <span className="text-[11px] leading-snug text-gray-700">
                                      {meta?.label ?? feature}
                                    </span>
                                  </span>);
                    })}
                            </span>
                          </span>
                        </span>
                      </span>
                    </li>)}
                </ul>

                {/* mt-auto pins CTA to the bottom so all cards' buttons align */}
                <div className="mt-auto pt-4">
                  <span className={cn('flex h-8 w-full items-center justify-center rounded-md text-xs font-semibold transition-colors', isSelected
                    ? theme.selectedBg
                    : 'border border-gray-300 bg-white text-gray-700 group-hover:border-gray-900 group-hover:text-gray-900')}>
                    {isSelected ? 'Selected' : 'Choose'}
                  </span>
                </div>
              </div>
            </button>);
        })}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white px-3.5 py-2.5 text-xs">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <Lock className="h-3 w-3 text-emerald-700"/>
        </span>
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-900">$0 today. $0 for {tiers[0]?.trialPeriodDays ?? 7} days.</p>
          <p className="text-gray-600">
            Bank-grade encryption by <span className="font-semibold text-gray-900">Stripe</span>. Cancel any time from your dashboard — no questions, no awkward calls.
          </p>
        </div>
      </div>
    </div>);
}
