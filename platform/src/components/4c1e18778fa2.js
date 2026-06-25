import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getAppUrl } from '@/components/d43e063edf4e';
import { createBillingPortalSession } from '@/components/f65c0062197f';
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const appUrl = getAppUrl(request.nextUrl.origin);
        const result = await createBillingPortalSession(auth.userId, appUrl);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.redirect(result.data.redirectUrl, { status: 303 });
    }
    catch (error) {
        console.error('[api/billing/subscription/portal] error', error);
        return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 });
    }
}
