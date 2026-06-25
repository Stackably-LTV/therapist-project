import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getRequestIP, getRequestUserAgent } from '@/components/0be57ea0c568';
import { approveTherapist } from '@/components/4c24c1cbd11b';
export async function POST(request) {
    try {
        const auth = await requireRole('admin');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const formData = await request.formData();
        const therapistId = formData.get('therapistId');
        if (!therapistId) {
            return NextResponse.json({ error: 'Therapist ID required' }, { status: 400 });
        }
        const result = await approveTherapist(auth.userId, therapistId, {
            ipAddress: getRequestIP(request.headers),
            userAgent: getRequestUserAgent(request.headers),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        if (result.data?.alreadyApproved) {
            return NextResponse.json({ ok: true, alreadyApproved: true });
        }
        // 303 (not the default 307): this endpoint is hit by a native <form method="POST">,
        // and 303 tells the browser to follow with GET /admin. A 307 would re-POST to the
        // page route and fail with "Failed to find Server Action".
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
        return NextResponse.redirect(new URL('/admin', baseUrl), 303);
    }
    catch (error) {
        console.error('Approve therapist error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
