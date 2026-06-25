import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { updateProviderNoteSchema } from '@/components/96d1be69afab';
import { getProviderNote, updateProviderNote, deleteProviderNote, } from '@/components/ddcb4f4c7cb2';
export async function GET(_request, { params }) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'session_notes');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { noteId } = await params;
    const result = await getProviderNote(auth.userId, noteId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ note: result.data });
}
export async function PATCH(request, { params }) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'session_notes');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { noteId } = await params;
    const body = updateProviderNoteSchema.parse(await request.json());
    const result = await updateProviderNote(auth.userId, noteId, body);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ note: result.data });
}
export async function DELETE(_request, { params }) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'session_notes');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { noteId } = await params;
    const result = await deleteProviderNote(auth.userId, noteId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
}
