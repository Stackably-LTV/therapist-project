import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { getStripe } from '@/components/d43e063edf4e';
import { ok, fail } from '@/components/7ff049787825';
import { getTherapistSubscriptionSummary } from '@/components/c5276438fd9f';
const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'incomplete']);
/**
 * File a cancellation request for the calling therapist. Snapshots the Stripe
 * subscription id + tier name so an admin can find and cancel the right
 * subscription in the Stripe dashboard later. RLS enforces that the row belongs
 * to the caller; we pass therapistId explicitly so the WITH CHECK passes.
 */
export async function createCancellationRequest(therapistId, responses) {
    const supabase = await createClient();
    // Block duplicate open requests so the admin queue stays clean.
    const { data: existing } = await supabase
        .from('subscription_cancellation_requests')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('status', 'pending')
        .maybeSingle();
    if (existing) {
        return fail(409, 'You already have a cancellation request being reviewed.');
    }
    // Snapshot the current subscription so the admin knows exactly what to cancel.
    const serviceClient = createServiceRoleClient();
    const [{ data: sub }, summary] = await Promise.all([
        serviceClient
            .from('billing_subscriptions')
            .select('stripe_subscription_id, status')
            .eq('therapist_id', therapistId)
            .maybeSingle(),
        getTherapistSubscriptionSummary(therapistId),
    ]);
    if (!sub || !ACTIVE_STATUSES.has(sub.status)) {
        return fail(400, "You don't have an active subscription to cancel.");
    }
    const primaryReason = typeof responses.primary_reason === 'string' ? responses.primary_reason : null;
    const { data, error } = await supabase
        .from('subscription_cancellation_requests')
        .insert({
        therapist_id: therapistId,
        status: 'pending',
        primary_reason: primaryReason,
        responses,
        stripe_subscription_id: sub.stripe_subscription_id ?? null,
        tier_name: summary.tierName,
    })
        .select('id')
        .single();
    if (error) {
        console.error('createCancellationRequest error:', error);
        return fail(500, 'Could not submit your cancellation request. Please try again.');
    }
    return ok({ requestId: data.id });
}
/** Admin work queue: every cancellation request, newest first. */
export async function listCancellationRequests() {
    const supabase = createServiceRoleClient();
    const { data: rows, error } = await supabase
        .from('subscription_cancellation_requests')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        console.error('listCancellationRequests error:', error);
        return fail(500, 'Could not load cancellation requests.');
    }
    if (!rows || rows.length === 0)
        return ok([]);
    // Resolve names from user_profiles and emails from the auth admin API.
    const ids = Array.from(new Set(rows.map((r) => r.therapist_id)));
    const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', ids);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const emailById = new Map();
    await Promise.all(ids.map(async (id) => {
        const { data } = await supabase.auth.admin.getUserById(id);
        if (data?.user?.email)
            emailById.set(id, data.user.email);
    }));
    const requests = rows.map((r) => ({
        id: r.id,
        therapistId: r.therapist_id,
        therapistName: nameById.get(r.therapist_id) ?? 'Unknown therapist',
        therapistEmail: emailById.get(r.therapist_id) ?? '—',
        status: r.status,
        primaryReason: r.primary_reason,
        tierName: r.tier_name,
        stripeSubscriptionId: r.stripe_subscription_id,
        responses: (r.responses ?? {}),
        adminNotes: r.admin_notes,
        createdAt: r.created_at,
        processedAt: r.processed_at,
    }));
    return ok(requests);
}
/**
 * Admin marks a request as handled. `completed` = cancel the subscription in
 * Stripe (scheduled at period end) and record it; `dismissed` = request
 * rejected / retained. Records who and when.
 *
 * When completing, we actually cancel in Stripe so the admin never has to do it
 * manually. We use `cancel_at_period_end` so the therapist keeps access through
 * the period they already paid for. The Stripe webhook syncs the local
 * `billing_subscriptions` row, so we don't write status here.
 */
export async function updateCancellationRequestStatus(requestId, adminId, status, adminNotes) {
    const supabase = createServiceRoleClient();
    if (status === 'completed') {
        const { data: request, error: fetchError } = await supabase
            .from('subscription_cancellation_requests')
            .select('stripe_subscription_id, therapist_id')
            .eq('id', requestId)
            .maybeSingle();
        if (fetchError || !request) {
            console.error('updateCancellationRequestStatus fetch error:', fetchError);
            return fail(500, 'Could not load the cancellation request.');
        }
        // Snapshot may be stale/missing; fall back to the live subscription row.
        let stripeSubscriptionId = request.stripe_subscription_id;
        if (!stripeSubscriptionId) {
            const { data: sub } = await supabase
                .from('billing_subscriptions')
                .select('stripe_subscription_id')
                .eq('therapist_id', request.therapist_id)
                .maybeSingle();
            stripeSubscriptionId = sub?.stripe_subscription_id ?? null;
        }
        if (!stripeSubscriptionId) {
            return fail(400, 'No Stripe subscription found for this therapist.');
        }
        try {
            await getStripe().subscriptions.update(stripeSubscriptionId, {
                cancel_at_period_end: true,
            });
        }
        catch (err) {
            console.error('updateCancellationRequestStatus Stripe cancel error:', err);
            return fail(502, 'Could not cancel the subscription in Stripe. Nothing was changed.');
        }
    }
    const { error } = await supabase
        .from('subscription_cancellation_requests')
        .update({
        status,
        admin_notes: adminNotes,
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })
        .eq('id', requestId);
    if (error) {
        console.error('updateCancellationRequestStatus error:', error);
        return fail(500, 'Could not update the request.');
    }
    return ok(null);
}
