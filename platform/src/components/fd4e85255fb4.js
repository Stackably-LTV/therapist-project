import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { listCharts, createChart } from '@/components/7b4587d7473b';
export async function GET(request) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'charts');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { searchParams } = new URL(request.url);
    const seekerId = searchParams.get('patientId') || searchParams.get('seekerId');
    const status = searchParams.get('status');
    const chartType = searchParams.get('chartType');
    const result = await listCharts(auth.userId, { seekerId, status, chartType });
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
}
export async function POST(request) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'charts');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const body = await request.json();
    const result = await createChart(auth.userId, body);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data, { status: 201 });
}
