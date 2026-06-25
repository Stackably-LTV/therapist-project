import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getAppUrl } from '@/components/d43e063edf4e';
import { startConnectOnboarding } from '@/components/6383a59c9ee0';
/**
 * Creates (or resumes) a Stripe Connect account for a therapist and redirects
 * them to Stripe's hosted onboarding flow. Pending therapists allowed —
 * Connect onboarding can happen pre-approval.
 */
export async function POST(request) {
    try {
        const auth = await requireRole('therapist', { allowStatuses: ['pending', 'active'] });
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const appUrl = getAppUrl(request.nextUrl.origin);
        const result = await startConnectOnboarding(auth.userId, appUrl);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.redirect(result.data.redirectUrl, { status: 303 });
    }
    catch (error) {
        console.error('[api/connect/onboarding] error', error);
        return NextResponse.json({ error: 'Failed to start Connect onboarding' }, { status: 500 });
    }
}
