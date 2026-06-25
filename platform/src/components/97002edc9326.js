import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getRequestIP, getRequestUserAgent } from '@/components/0be57ea0c568';
import { rejectTherapist } from '@/components/e6b1ca59aa2e';
export async function POST(request) {
    try {
        const auth = await requireRole('admin');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const formData = await request.formData();
        const therapistId = formData.get('therapistId');
        const rawReason = formData.get('reason');
        if (!therapistId) {
            return NextResponse.json({ error: 'Therapist ID required' }, { status: 400 });
        }
        const result = await rejectTherapist(auth.userId, therapistId, rawReason, {
            ipAddress: getRequestIP(request.headers),
            userAgent: getRequestUserAgent(request.headers),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        // Return JSON, not a redirect. The client calls this via fetch(), which
        // auto-follows redirects — and NextResponse.redirect()'s default 307 would
        // re-POST to /admin (→ "Failed to find Server Action" 500). The modal
        // handles navigation itself on a 2xx response.
        return NextResponse.json({ ok: true });
    }
    catch (error) {
        console.error('Reject therapist error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
