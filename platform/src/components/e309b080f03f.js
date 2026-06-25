import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Search active diagnosis codes by code or name (case-insensitive), capped at 25
 * rows ordered by code. An empty query returns the first 25 active codes.
 */
export async function searchDiagnoses(rawQuery) {
    const q = String(rawQuery || '').trim();
    const supabase = await createClient();
    let query = supabase
        .from('diagnosis_codes')
        .select('*')
        .eq('is_active', true)
        .order('code', { ascending: true })
        .limit(25);
    if (q) {
        const escaped = q.replace(/[%,]/g, '');
        query = query.or(`code.ilike.%${escaped}%,name.ilike.%${escaped}%`);
    }
    const { data: diagnoses, error } = await query;
    if (error)
        return fail(500, error.message);
    return ok({ diagnoses: diagnoses ?? [] });
}
