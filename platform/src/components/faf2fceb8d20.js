import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { updateObjective, deleteObjective } from '@/components/2f6bcc4feedf';
export async function PATCH(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { planId, objectiveId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await updateObjective(auth.userId, planId, objectiveId, body);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[treatment-plans/:planId/objectives/:objectiveId] PATCH error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function DELETE(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { planId, objectiveId } = await params;
        const result = await deleteObjective(auth.userId, planId, objectiveId);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[treatment-plans/:planId/objectives/:objectiveId] DELETE error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
