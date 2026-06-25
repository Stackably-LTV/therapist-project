import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
const SEEKER_SELECT = '*, seeker:user_profiles!clinical_charts_seeker_id_fkey(user_id, full_name)';
/** List a therapist's clinical charts, optionally filtered by seeker/status/type. */
export async function listCharts(therapistId, filters) {
    const supabase = await createClient();
    let query = supabase
        .from('clinical_charts')
        .select(SEEKER_SELECT)
        .eq('therapist_id', therapistId)
        .order('created_at', { ascending: false });
    if (filters.seekerId)
        query = query.eq('seeker_id', filters.seekerId);
    if (filters.status)
        query = query.eq('status', filters.status);
    if (filters.chartType)
        query = query.eq('chart_type', filters.chartType);
    const { data: charts, error } = await query;
    if (error)
        return fail(500, error.message);
    return ok({ charts });
}
/** Create a clinical chart for a therapist, optionally assigned to a seeker. */
export async function createChart(therapistId, body) {
    const supabase = await createClient();
    const { title, chartType, content, patientId, seekerId, isShared } = body;
    const targetSeekerId = seekerId || patientId;
    if (!title || title.trim().length === 0) {
        return fail(400, 'Title is required');
    }
    const insertData = {
        therapist_id: therapistId,
        title: title.trim(),
        chart_type: chartType || 'custom',
        content: content || {},
        is_shared: isShared || false,
    };
    if (targetSeekerId) {
        insertData.seeker_id = targetSeekerId;
        insertData.status = 'assigned';
        insertData.assigned_at = new Date().toISOString();
    }
    const { data: chart, error } = await supabase
        .from('clinical_charts')
        .insert(insertData)
        .select(SEEKER_SELECT)
        .single();
    if (error)
        return fail(500, error.message);
    return ok({ chart });
}
/** Fetch a single chart owned by the therapist. */
export async function getChart(therapistId, chartId) {
    const supabase = await createClient();
    const { data: chart, error } = await supabase
        .from('clinical_charts')
        .select(SEEKER_SELECT)
        .eq('id', chartId)
        .eq('therapist_id', therapistId)
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!chart)
        return fail(404, 'Chart not found');
    return ok({ chart });
}
/** Partially update a chart owned by the therapist. */
export async function updateChart(therapistId, chartId, body) {
    const supabase = await createClient();
    const { title, chartType, content, patientId, seekerId, status, isShared } = body;
    const targetSeekerId = seekerId !== undefined ? seekerId : patientId;
    const updateData = {};
    if (title !== undefined) {
        if (title.trim().length === 0) {
            return fail(400, 'Title cannot be empty');
        }
        updateData.title = title.trim();
    }
    if (chartType !== undefined)
        updateData.chart_type = chartType;
    if (content !== undefined)
        updateData.content = content;
    if (targetSeekerId !== undefined) {
        updateData.seeker_id = targetSeekerId || null;
        if (targetSeekerId) {
            updateData.assigned_at = new Date().toISOString();
            updateData.status = 'assigned';
        }
    }
    if (status !== undefined) {
        updateData.status = status;
        if (status === 'assigned' && !updateData.assigned_at)
            updateData.assigned_at = new Date().toISOString();
        if (status === 'completed')
            updateData.completed_at = new Date().toISOString();
        if (status === 'reviewed')
            updateData.reviewed_at = new Date().toISOString();
    }
    if (isShared !== undefined)
        updateData.is_shared = isShared;
    const { data: chart, error } = await supabase
        .from('clinical_charts')
        .update(updateData)
        .eq('id', chartId)
        .eq('therapist_id', therapistId)
        .select(SEEKER_SELECT)
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!chart)
        return fail(404, 'Chart not found');
    return ok({ chart });
}
/** Delete a chart owned by the therapist. */
export async function deleteChart(therapistId, chartId) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('clinical_charts')
        .delete()
        .eq('id', chartId)
        .eq('therapist_id', therapistId);
    if (error)
        return fail(500, error.message);
    return ok(null);
}
