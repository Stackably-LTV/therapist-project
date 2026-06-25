import { NextResponse } from 'next/server';
import { requireRole, requireFeature } from '@/components/3168fa71d1e4';
import { createProviderNoteSchema } from '@/components/96d1be69afab';
import { listProviderNotes, createProviderNote } from '@/components/ddcb4f4c7cb2';
export async function GET(request) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'session_notes');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { searchParams } = new URL(request.url);
    const seekerId = searchParams.get('patientId') || searchParams.get('seekerId');
    const noteType = searchParams.get('noteType');
    const result = await listProviderNotes(auth.userId, { seekerId, noteType });
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ notes: result.data });
}
export async function POST(request) {
    const auth = await requireRole('therapist');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const gate = await requireFeature(auth.userId, 'session_notes');
    if (!gate.ok)
        return NextResponse.json({ error: gate.error }, { status: gate.status });
    const body = createProviderNoteSchema.parse(await request.json());
    const result = await createProviderNote(auth.userId, body);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ note: result.data }, { status: 201 });
}
