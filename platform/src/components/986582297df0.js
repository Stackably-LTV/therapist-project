import { NextResponse } from 'next/server';
import { getUser } from '@/components/9a6b39502e62';
import { consultationResponseStatusSchema } from '@/components/8cb29cb938f6';
import { respondToConsultationRequest, deleteConsultationRequest, } from '@/components/d6f403b8fbcb';
export async function PATCH(request, { params }) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { requestId } = await params;
        const body = await request.json().catch(() => ({}));
        const parsed = consultationResponseStatusSchema.safeParse(body?.status);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const result = await respondToConsultationRequest(user.id, requestId, parsed.data);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ consultation_request: result.data });
    }
    catch (err) {
        console.error('Update consultation request error:', err);
        return NextResponse.json({ error: 'Failed to update consultation request' }, { status: 500 });
    }
}
export async function DELETE(_request, { params }) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { requestId } = await params;
        const result = await deleteConsultationRequest(user.id, requestId);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ ok: true });
    }
    catch (err) {
        console.error('Delete consultation request error:', err);
        return NextResponse.json({ error: 'Failed to delete consultation request' }, { status: 500 });
    }
}
