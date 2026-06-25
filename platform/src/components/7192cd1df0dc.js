import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { getChart, updateChart, deleteChart } from '@/components/7b4587d7473b';
export async function GET(_request, { params }) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'charts');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { chartId } = await params;
    const result = await getChart(auth.userId, chartId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
}
export async function PATCH(request, { params }) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'charts');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { chartId } = await params;
    const body = await request.json();
    const result = await updateChart(auth.userId, chartId, body);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
}
export async function DELETE(_request, { params }) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'charts');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { chartId } = await params;
    const result = await deleteChart(auth.userId, chartId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
}
