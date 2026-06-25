import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { resendPatientInvite } from '@/components/7b4587d7473b';
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await resendPatientInvite(auth.userId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (error) {
        console.error('[api/therapist/patients/invites/resend] POST error', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
