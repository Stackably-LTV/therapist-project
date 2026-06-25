import { hasTherapistFeature } from '@/components/18f37321d6fb';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
const BASE_THERAPIST_FEATURES = ['profile', 'contact'];
const PREMIUM_ACCESS_STATUSES = new Set(['active', 'trialing', 'past_due']);
function normalizeFeatureList(featuresJson) {
    if (!Array.isArray(featuresJson))
        return [...BASE_THERAPIST_FEATURES];
    const features = featuresJson.filter((value) => typeof value === 'string' && value.trim().length > 0);
    return Array.from(new Set([...BASE_THERAPIST_FEATURES, ...features]));
}
export async function getTherapistSubscriptionSummary(therapistId) {
    const supabase = createServiceRoleClient();
    const { data: subscription } = await supabase
        .from('billing_subscriptions')
        .select(`
      status,
      current_period_end,
      tier:billing_tiers(code, name, price_cents, features_json)
    `)
        .eq('therapist_id', therapistId)
        .maybeSingle();
    if (!subscription) {
        return {
            status: null,
            tierCode: null,
            tierName: null,
            priceCents: null,
            currentPeriodEnd: null,
            features: [...BASE_THERAPIST_FEATURES],
        };
    }
    const tier = subscription.tier ?? null;
    const tierFeatures = normalizeFeatureList(tier?.features_json);
    const features = PREMIUM_ACCESS_STATUSES.has(subscription.status)
        ? tierFeatures
        : [...BASE_THERAPIST_FEATURES];
    return {
        status: subscription.status ?? null,
        tierCode: tier?.code ?? null,
        tierName: tier?.name ?? null,
        priceCents: tier?.price_cents ?? null,
        currentPeriodEnd: subscription.current_period_end ?? null,
        features,
    };
}
export async function getTherapistFeatures(therapistId) {
    const summary = await getTherapistSubscriptionSummary(therapistId);
    return new Set(summary.features);
}
export async function therapistHasFeature(therapistId, feature) {
    const features = await getTherapistFeatures(therapistId);
    return hasTherapistFeature(features, feature);
}
