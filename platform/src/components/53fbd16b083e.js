import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { listObjectives, createObjective } from '@/components/2f6bcc4feedf';
export async function GET(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { planId, goalId } = await params;
        const result = await listObjectives(auth.userId, planId, goalId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[treatment-plans/:planId/goals/:goalId/objectives] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { planId, goalId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await createObjective(auth.userId, planId, goalId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        const { created, ...payload } = result.data;
        return NextResponse.json(payload, { status: 201 });
    }
    catch (err) {
        console.error('[treatment-plans/:planId/goals/:goalId/objectives] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
