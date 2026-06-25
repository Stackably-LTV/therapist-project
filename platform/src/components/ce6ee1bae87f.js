import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getRequestIP, getRequestUserAgent } from '@/components/0be57ea0c568';
import { acknowledgeTreatmentPlan } from '@/components/f7f46174d1fc';
export async function POST(request) {
    try {
        const auth = await requireRole('seeker');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        let planId;
        let redirectTo = null;
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await request.json().catch(() => ({}));
            planId = String(body?.planId || '').trim();
        }
        else {
            const formData = await request.formData();
            planId = String(formData.get('planId') || '').trim();
            redirectTo = String(formData.get('redirectTo') || '').trim() || null;
        }
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
        if (!planId) {
            if (redirectTo)
                return NextResponse.redirect(new URL(redirectTo, baseUrl));
            return NextResponse.json({ error: 'planId is required' }, { status: 400 });
        }
        const result = await acknowledgeTreatmentPlan(auth.userId, planId, {
            ipAddress: getRequestIP(request.headers),
            userAgent: getRequestUserAgent(request.headers),
        });
        if (!result.ok) {
            if (redirectTo)
                return NextResponse.redirect(new URL(redirectTo, baseUrl));
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        if (redirectTo)
            return NextResponse.redirect(new URL(redirectTo, baseUrl));
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('[api/seeker/treatment-plan-ack] POST error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
