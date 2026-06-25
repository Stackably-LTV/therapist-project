import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { getSeekerNoteForDownload } from '@/components/f7f46174d1fc';
export async function GET(_request, { params }) {
    const { noteId } = await params;
    const auth = await requireRole('seeker');
    if (!auth.ok)
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    const result = await getSeekerNoteForDownload(auth.userId, noteId);
    if (!result.ok)
        return NextResponse.json({ error: result.error }, { status: result.status });
    const note = result.data.note;
    const safeTitle = String(note.title || 'note')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
    const filename = `${safeTitle || 'note'}-${note.id}.json`;
    return new NextResponse(JSON.stringify(note, null, 2), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'content-disposition': `attachment; filename="${filename}"`,
        },
    });
}
