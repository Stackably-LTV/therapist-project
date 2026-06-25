import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { asOptionalString } from '@/components/95a1b355cb8b';
import { listSessionServiceCodes, attachSessionServiceCode, detachSessionServiceCode, } from '@/components/9c7b3a056231';
export async function GET(_request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { sessionId } = await params;
        const result = await listSessionServiceCodes({ therapistId: auth.userId, sessionId });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/sessions/:sessionId/service-codes] GET error', err);
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
        const { sessionId } = await params;
        const body = await request.json().catch(() => ({}));
        const result = await attachSessionServiceCode({
            therapistId: auth.userId,
            sessionId,
            codeId: asOptionalString(body?.codeId),
            units: body?.units == null ? undefined : Number(body.units),
            modifiers: body?.modifiers,
            diagnosisPointer: asOptionalString(body?.diagnosisPointer),
            feeOverride: body?.feeOverride,
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data, { status: 201 });
    }
    catch (err) {
        console.error('[api/therapist/sessions/:sessionId/service-codes] POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function DELETE(request, { params }) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const gate = await requireFeature(auth.userId, 'charts');
        if (!gate.ok)
            return NextResponse.json({ error: gate.error }, { status: gate.status });
        const { sessionId } = await params;
        const { searchParams } = new URL(request.url);
        const result = await detachSessionServiceCode({
            therapistId: auth.userId,
            sessionId,
            codeId: asOptionalString(searchParams.get('codeId')),
        });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json(result.data);
    }
    catch (err) {
        console.error('[api/therapist/sessions/:sessionId/service-codes] DELETE error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
