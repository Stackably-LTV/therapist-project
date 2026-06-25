import { NextResponse } from 'next/server';
import { requireRole } from '@/components/3168fa71d1e4';
import { searchDiagnoses } from '@/components/e309b080f03f';
export async function GET(request) {
    try {
        const auth = await requireRole('therapist');
        if (!auth.ok)
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { searchParams } = new URL(request.url);
        const q = String(searchParams.get('q') || '').trim();
        const result = await searchDiagnoses(q);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json({ diagnoses: result.data.diagnoses });
    }
    catch (err) {
        console.error('[api/diagnosis/search] GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
