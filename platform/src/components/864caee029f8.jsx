import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/components/98e56006aa84';
import { Badge } from '@/components/30348591d689';
import { Button } from '@/components/2795b661f080';
import { THERAPIST_FEATURE_META, } from '@/components/18f37321d6fb';
import { formatTierPrice, } from '@/components/8c48aa284994';
const DEFAULT_THEME = {
    accent: 'text-slate-700',
    ring: 'ring-slate-200',
    haloFrom: 'from-slate-50',
    haloTo: 'to-white',
    badge: 'bg-slate-100 text-slate-700',
    buttonVariant: 'outline',
};
const TIER_THEMES = {
    t1_essentials: {
        accent: 'text-slate-700',
        ring: 'ring-slate-200',
        haloFrom: 'from-slate-50',
        haloTo: 'to-white',
        badge: 'bg-slate-900 text-white',
        buttonVariant: 'outline',
    },
    t2_practice: {
        accent: 'text-indigo-700',
        ring: 'ring-indigo-500',
        haloFrom: 'from-indigo-50',
        haloTo: 'to-white',
        badge: 'bg-indigo-600 text-white',
        buttonVariant: 'default',
    },
    t3_pro: {
        accent: 'text-violet-700',
        ring: 'ring-violet-300',
        haloFrom: 'from-violet-50',
        haloTo: 'to-white',
        badge: 'bg-violet-600 text-white',
        buttonVariant: 'default',
    },
};
export function PricingCard({ tier, highlight = false, isCurrent = false, action, footnote, }) {
    const theme = TIER_THEMES[tier.code] ?? DEFAULT_THEME;
    const isHighlighted = highlight || isCurrent;
    const showBadge = Boolean(tier.badge);
    return (<article className={cn('relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all', 'hover:-translate-y-0.5 hover:shadow-md', isHighlighted
            ? `border-transparent ring-2 ${theme.ring}`
            : 'border-gray-200')}>
      {/* Top halo glow */}
      <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 rounded-t-2xl bg-gradient-to-b opacity-60', theme.haloFrom, theme.haloTo)}/>

      {showBadge && (<div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className={cn('border-0 px-3 py-1 shadow-sm', theme.badge)}>
            <Sparkles className="mr-1 h-3 w-3"/>
            {tier.badge}
          </Badge>
        </div>)}

      <header className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={cn('text-lg font-semibold', theme.accent)}>{tier.name}</h3>
          {isCurrent && (<Badge variant="secondary" className="border-0 bg-emerald-100 text-emerald-700">
              Current
            </Badge>)}
        </div>
        {tier.tagline && (<p className="text-sm text-gray-500">{tier.tagline}</p>)}
      </header>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-gray-900">
          {formatTierPrice(tier)}
        </span>
        <span className="text-sm text-gray-500">/month</span>
      </div>

      {tier.trialPeriodDays > 0 && (<p className="mt-2 text-xs font-medium text-emerald-700">
          {tier.trialPeriodDays}-day free trial. Cancel anytime.
        </p>)}

      {tier.description && (<p className="mt-4 text-sm leading-relaxed text-gray-600">
          {tier.description}
        </p>)}

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((feature) => (<FeatureRow key={feature} feature={feature} accent={theme.accent}/>))}
      </ul>

      <div className="mt-8">
        <PricingCta action={action} fallbackVariant={theme.buttonVariant}/>
        {footnote && (<p className="mt-3 text-center text-xs text-gray-500">{footnote}</p>)}
      </div>
    </article>);
}
function FeatureRow({ feature, accent, }) {
    const meta = THERAPIST_FEATURE_META[feature];
    return (<li className="flex items-start gap-3 text-sm">
      <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10', accent)}>
        <Check className={cn('h-3 w-3', accent)} strokeWidth={3}/>
      </span>
      <span className="space-y-0.5">
        <span className="block font-medium text-gray-900">{meta.label}</span>
        <span className="block text-xs text-gray-500">{meta.description}</span>
      </span>
    </li>);
}
function PricingCta({ action, fallbackVariant, }) {
    const variant = action.variant ?? fallbackVariant;
    const sizeClass = 'w-full h-11 text-sm font-semibold';
    if (action.href) {
        return (<Button asChild variant={variant} disabled={action.disabled} className={sizeClass}>
        <a href={action.href} aria-disabled={action.disabled || undefined}>
          {action.label}
        </a>
      </Button>);
    }
    if (action.formAction) {
        return (<form action={action.formAction} method="post" className="w-full">
        {action.hiddenFields &&
                Object.entries(action.hiddenFields).map(([name, value]) => (<input key={name} type="hidden" name={name} value={value}/>))}
        <Button type="submit" variant={variant} disabled={action.disabled} className={sizeClass}>
          {action.label}
        </Button>
      </form>);
    }
    return (<Button variant={variant} disabled className={sizeClass}>
      {action.label}
    </Button>);
}
export function PricingCardsGrid({ children }) {
    return (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>);
}
