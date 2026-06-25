import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { downloadProviderNote } from '@/components/ddcb4f4c7cb2';
export async function GET(_request, { params }) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'session_notes');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { noteId } = await params;
    const result = await downloadProviderNote(auth.userId, noteId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return new NextResponse(result.data.body, {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'content-disposition': `attachment; filename="${result.data.filename}"`,
        },
    });
}
