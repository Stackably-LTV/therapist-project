import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { isStripeTestMode } from '@/components/d43e063edf4e';
import { THERAPIST_FEATURE_META, } from '@/components/18f37321d6fb';
export { formatTierPrice } from '@/components/8c48aa284994';
const KNOWN_FEATURES = new Set(Object.keys(THERAPIST_FEATURE_META));
function normaliseFeatures(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((entry) => typeof entry === 'string' && KNOWN_FEATURES.has(entry));
}
function rowToTier(row) {
    const testMode = isStripeTestMode();
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        tagline: row.tagline,
        description: row.description,
        badge: row.badge,
        sortOrder: row.sort_order,
        priceCents: row.price_cents,
        currency: row.currency,
        trialPeriodDays: row.trial_period_days,
        features: normaliseFeatures(row.features_json),
        stripePriceId: testMode ? row.stripe_price_id_test : row.stripe_price_id,
        stripeProductId: testMode ? row.stripe_product_id_test : row.stripe_product_id,
    };
}
const TIER_COLUMNS = `
  id, code, name, tagline, description, badge, sort_order,
  price_cents, currency, trial_period_days, features_json,
  stripe_price_id, stripe_price_id_test,
  stripe_product_id, stripe_product_id_test,
  is_active
`;
/** All active tiers, sorted ascending by sort_order. Used by /pricing, signup picker, upgrade modal. */
export async function listActiveTiers() {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('billing_tiers')
        .select(TIER_COLUMNS)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    if (error) {
        console.error('[tiers.service] listActiveTiers failed', error);
        return [];
    }
    return data.map(rowToTier);
}
export async function getTierByCode(code) {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('billing_tiers')
        .select(TIER_COLUMNS)
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();
    if (error || !data)
        return null;
    return rowToTier(data);
}
