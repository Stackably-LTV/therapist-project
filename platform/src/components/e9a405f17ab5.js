import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { updateCancellationRequestStatus } from '@/components/4c1649935362';
export async function PATCH(request, { params }) {
    try {
        const auth = await requireRole('admin');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { requestId } = await params;
        let body;
        try {
            body = await request.json();
        }
        catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const status = body?.status;
        if (status !== 'completed' && status !== 'dismissed') {
            return NextResponse.json({ error: "status must be 'completed' or 'dismissed'" }, { status: 400 });
        }
        const rawNotes = body?.adminNotes;
        const adminNotes = typeof rawNotes === 'string' && rawNotes.trim() ? rawNotes.trim() : null;
        const result = await updateCancellationRequestStatus(requestId, auth.userId, status, adminNotes);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        return NextResponse.json({ ok: true });
    }
    catch (error) {
        console.error('Update cancellation request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
