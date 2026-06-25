import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getAppUrl } from '@/components/d43e063edf4e';
import { createConnectDashboardLink } from '@/components/6383a59c9ee0';
/**
 * Creates a single-use Express dashboard login link for the calling therapist
 * (or redirects them to onboarding if their Connect account isn't ready).
 */
export async function POST(request) {
    try {
        const auth = await requireRole('therapist', { allowStatuses: ['pending', 'active'] });
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const appUrl = getAppUrl(request.nextUrl.origin);
        const result = await createConnectDashboardLink(auth.userId, appUrl);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.redirect(result.data.redirectUrl, { status: 303 });
    }
    catch (error) {
        console.error('[api/connect/dashboard] error', error);
        return NextResponse.json({ error: 'Failed to open Stripe dashboard' }, { status: 500 });
    }
}
