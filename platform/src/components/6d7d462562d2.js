import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { listPatients, invitePatient } from '@/components/7b4587d7473b';
export async function GET(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        // Listing your own caseload is not paywalled. Either a clinical-charts subscriber
        // OR a course-creation subscriber should be able to load patients (e.g. to assign
        // a course). Block only if both are missing.
        const [chartsGate, coursesGate] = await Promise.all([
            requireFeature(auth.userId, 'charts'),
            requireFeature(auth.userId, 'course_creation'),
        ]);
        if (!chartsGate.ok && !coursesGate.ok) {
            return NextResponse.json({ error: chartsGate.error }, { status: chartsGate.status });
        }
        const includeArchived = request.nextUrl.searchParams.get('archived') === '1';
        const result = await listPatients(auth.userId, includeArchived);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/patients] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const body = await request.json().catch(() => ({}));
        const result = await invitePatient(auth.userId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data, result.status ? { status: result.status } : undefined);
    }
    catch (err) {
        console.error('[api/therapist/patients] POST error', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
    }
}
