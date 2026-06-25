import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getAppUrl } from '@/components/d43e063edf4e';
import { subscriptionCheckoutSchema } from '@/components/57a2ee977811';
import { createSubscriptionCheckout } from '@/components/a386fa395b18';
async function readCheckoutInput(request) {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const body = await request.json().catch(() => ({}));
        return {
            tierCode: typeof body?.tierCode === 'string' ? body.tierCode.trim() : '',
            successPath: typeof body?.successPath === 'string' ? body.successPath : null,
            cancelPath: typeof body?.cancelPath === 'string' ? body.cancelPath : null,
        };
    }
    const formData = await request.formData();
    return {
        tierCode: typeof formData.get('tierCode') === 'string' ? String(formData.get('tierCode')).trim() : '',
        successPath: typeof formData.get('successPath') === 'string' ? String(formData.get('successPath')) : null,
        cancelPath: typeof formData.get('cancelPath') === 'string' ? String(formData.get('cancelPath')) : null,
    };
}
export async function POST(request) {
    try {
        // Onboarding-time route: pending therapists must reach Checkout so they can
        // start their trial. Admin approval happens AFTER payment + final submission.
        const auth = await requireRole('therapist', { allowStatuses: ['pending', 'active'] });
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const raw = await readCheckoutInput(request);
        if (!raw.tierCode) {
            return NextResponse.json({ error: 'Tier code is required' }, { status: 400 });
        }
        const input = subscriptionCheckoutSchema.parse(raw);
        const appUrl = getAppUrl(request.nextUrl.origin);
        const result = await createSubscriptionCheckout(auth.userId, appUrl, input);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.redirect(result.data.redirectUrl, { status: 303 });
    }
    catch (error) {
        console.error('[api/billing/subscription/checkout] error', error);
        return NextResponse.json({ error: 'Failed to start subscription checkout' }, { status: 500 });
    }
}
