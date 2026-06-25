import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { getStripe } from '@/components/d43e063edf4e';
import { ok } from '@/components/7ff049787825';
/** Derive our onboarding_status enum from a live Stripe account. */
function deriveOnboardingStatus(account) {
    if (account.charges_enabled && account.payouts_enabled)
        return 'completed';
    if (account.requirements?.disabled_reason)
        return 'restricted';
    if ((account.requirements?.currently_due?.length || 0) > 0)
        return 'in_progress';
    return 'pending';
}
/**
 * Pull the therapist's Connect account state from Stripe and write it back to
 * `billing_connect_accounts`. This is the synchronous counterpart to the
 * `account.updated` webhook — the webhook only fires for connected-account
 * events on a Connect-scoped endpoint, so this guarantees status flips to
 * `completed` the moment the therapist returns from Stripe onboarding, with no
 * webhook dependency. Returns the freshly-synced status, or null if there's no
 * Connect account yet.
 */
export async function refreshConnectAccountStatus(userId) {
    const supabase = createServiceRoleClient();
    const { data: row } = await supabase
        .from('billing_connect_accounts')
        .select('stripe_account_id')
        .eq('therapist_id', userId)
        .maybeSingle();
    if (!row?.stripe_account_id)
        return null;
    try {
        const account = await getStripe().accounts.retrieve(row.stripe_account_id);
        const next = {
            onboarding_status: deriveOnboardingStatus(account),
            charges_enabled: Boolean(account.charges_enabled),
            payouts_enabled: Boolean(account.payouts_enabled),
        };
        await supabase
            .from('billing_connect_accounts')
            .update(next)
            .eq('therapist_id', userId);
        return next;
    }
    catch (err) {
        console.error('[connect.service] refreshConnectAccountStatus failed', err);
        return null;
    }
}
/**
 * Creates a single-use Express dashboard login link for the calling therapist.
 *
 * https://docs.stripe.com/api/account/create_login_link
 *
 * Requires the Connect account onboarding to be at least past the
 * details_submitted gate. If there's no account, or the login link fails
 * (usually details_submitted=false), we return the onboarding redirect instead.
 */
export async function createConnectDashboardLink(userId, appUrl) {
    const supabase = await createClient();
    const { data: connectAccount } = await supabase
        .from('billing_connect_accounts')
        .select('stripe_account_id, onboarding_status')
        .eq('therapist_id', userId)
        .maybeSingle();
    if (!connectAccount?.stripe_account_id) {
        // No account yet — punt them to onboarding.
        return ok({ redirectUrl: `${appUrl}/therapist/billing?connect=missing` });
    }
    const stripe = getStripe();
    try {
        const loginLink = await stripe.accounts.createLoginLink(connectAccount.stripe_account_id);
        return ok({ redirectUrl: loginLink.url });
    }
    catch (err) {
        // Most common cause: details_submitted=false (onboarding never completed).
        // Fall back to onboarding flow so the therapist finishes their KYC.
        console.warn('[api/connect/dashboard] createLoginLink failed, sending to onboarding', err);
        return ok({ redirectUrl: `${appUrl}/api/connect/onboarding` });
    }
}
/**
 * Creates (or resumes) a Stripe Connect account for a therapist and returns the
 * hosted onboarding URL to redirect to.
 *
 * Pattern: Express-style controller properties (modern v2 Account API).
 *   - Therapist gets an Express dashboard at https://connect.stripe.com.
 *   - Platform (us) absorbs disputes + pays Stripe fees.
 *   - Stripe owns the KYC requirements collection UI.
 */
export async function startConnectOnboarding(userId, appUrl) {
    const supabase = await createClient();
    const stripe = getStripe();
    // Stripe rejects localhost as a business URL. For dev, fall back to the
    // public-facing URL env if present, otherwise omit url entirely.
    const publicBusinessUrl = (() => {
        if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
            const fallback = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
            if (fallback && !fallback.includes('localhost') && !fallback.includes('127.0.0.1')) {
                return fallback.replace(/\/$/, '');
            }
            return undefined;
        }
        return appUrl;
    })();
    const { data: existing } = await supabase
        .from('billing_connect_accounts')
        .select('*')
        .eq('therapist_id', userId)
        .maybeSingle();
    let stripeAccountId = existing?.stripe_account_id ?? null;
    // Guard against a stored account the current key can't reach — e.g. a row
    // created in test mode while we now run a live key. Reusing it would make
    // accountLinks.create throw "no such account". If unreachable, drop it and
    // fall through to creating a fresh account.
    if (stripeAccountId) {
        try {
            await stripe.accounts.retrieve(stripeAccountId);
        }
        catch {
            stripeAccountId = null;
        }
    }
    if (!stripeAccountId) {
        // Pull email + name so Stripe pre-fills the onboarding form.
        const svcEarly = createServiceRoleClient();
        const { data: authUser } = await svcEarly.auth.admin.getUserById(userId);
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', userId)
            .maybeSingle();
        const account = await stripe.accounts.create({
            country: 'US',
            email: authUser?.user?.email ?? undefined,
            business_type: 'individual',
            business_profile: {
                mcc: '8011', // Medical/health services — physicians
                name: profile?.full_name || authUser?.user?.email || undefined,
                product_description: 'Licensed therapy sessions delivered through the Psychlink platform.',
                ...(publicBusinessUrl ? { url: publicBusinessUrl } : {}),
            },
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            controller: {
                losses: { payments: 'application' }, // platform absorbs disputes/refunds
                fees: { payer: 'application' }, // platform pays Stripe fees
                stripe_dashboard: { type: 'express' }, // therapist gets Express dashboard
                requirement_collection: 'stripe', // Stripe hosts the KYC UI
            },
            metadata: {
                therapistId: userId,
            },
        });
        stripeAccountId = account.id;
        const svc = createServiceRoleClient();
        await svc
            .from('billing_connect_accounts')
            .upsert({
            therapist_id: userId,
            stripe_account_id: account.id,
            onboarding_status: 'pending',
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
        }, { onConflict: 'therapist_id' });
    }
    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        type: 'account_onboarding',
        refresh_url: `${appUrl}/therapist/billing?connect=refresh`,
        return_url: `${appUrl}/therapist/billing?connect=return`,
        collection_options: { fields: 'currently_due' },
    });
    if (existing?.onboarding_status !== 'completed') {
        const svc = createServiceRoleClient();
        await svc
            .from('billing_connect_accounts')
            .update({ onboarding_status: 'in_progress' })
            .eq('therapist_id', userId);
    }
    return ok({ redirectUrl: accountLink.url });
}
