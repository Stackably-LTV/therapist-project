import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { ok, fail } from '@/components/7ff049787825';
/** Attach lightweight patient info to a list of provider notes. */
async function attachPatients(supabase, notes) {
    const seekerIds = Array.from(new Set(notes.map((note) => note.seeker_id).filter((id) => Boolean(id))));
    const profilesByUserId = new Map();
    if (seekerIds.length > 0) {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', seekerIds);
        profiles?.forEach((profile) => {
            profilesByUserId.set(profile.user_id, { full_name: profile.full_name });
        });
    }
    return notes.map((note) => {
        const profile = note.seeker_id ? profilesByUserId.get(note.seeker_id) : null;
        return {
            ...note,
            patient_id: note.seeker_id,
            patient: note.seeker_id
                ? {
                    id: note.seeker_id,
                    name: profile?.full_name || 'Client',
                    email: '',
                }
                : null,
        };
    });
}
/** Attach lightweight patient info to a single provider note. */
async function attachPatient(supabase, note) {
    if (!note.seeker_id) {
        return { ...note, patient_id: null, patient: null };
    }
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', note.seeker_id)
        .maybeSingle();
    return {
        ...note,
        patient_id: note.seeker_id,
        patient: {
            id: note.seeker_id,
            name: profile?.full_name || 'Client',
            email: '',
        },
    };
}
/** List the therapist's provider notes, optionally filtered by seeker/type. */
export async function listProviderNotes(therapistId, filters) {
    const supabase = await createClient();
    let query = supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('therapist_id', therapistId)
        .order('created_at', { ascending: false });
    if (filters.seekerId)
        query = query.eq('seeker_id', filters.seekerId);
    if (filters.noteType)
        query = query.eq('note_type', filters.noteType);
    const { data: notes, error } = await query;
    if (error)
        return fail(500, error.message);
    return ok(await attachPatients(supabase, (notes ?? [])));
}
/** Create a provider note for the therapist. */
export async function createProviderNote(therapistId, input) {
    const { title, content, patientId, seekerId, noteType, isPrivate, templateKey, templateData } = input;
    const targetSeekerId = seekerId || patientId;
    if (!title || title.trim().length === 0) {
        return fail(400, 'Title is required');
    }
    const supabase = await createClient();
    const { data: note, error } = await supabase
        .from('clinical_provider_notes')
        .insert({
        therapist_id: therapistId,
        seeker_id: targetSeekerId || null,
        title: title.trim(),
        content: content || null,
        note_type: noteType || 'general',
        is_private: isPrivate !== false,
        template_key: templateKey || null,
        template_data: templateData || {},
    })
        .select('*')
        .single();
    if (error)
        return fail(500, error.message);
    const [noteWithPatient] = await attachPatients(supabase, [note]);
    return ok(noteWithPatient);
}
/** Fetch a single provider note owned by the therapist. */
export async function getProviderNote(therapistId, noteId) {
    const supabase = await createClient();
    const { data: note, error } = await supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('id', noteId)
        .eq('therapist_id', therapistId)
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!note)
        return fail(404, 'Note not found');
    return ok(await attachPatient(supabase, note));
}
/** Update a provider note owned by the therapist. */
export async function updateProviderNote(therapistId, noteId, input) {
    const { title, content, patientId, seekerId, noteType, isPrivate, templateKey, templateData } = input;
    const targetSeekerId = seekerId !== undefined ? seekerId : patientId;
    const updateData = {};
    if (title !== undefined) {
        if (title.trim().length === 0) {
            return fail(400, 'Title cannot be empty');
        }
        updateData.title = title.trim();
    }
    if (content !== undefined)
        updateData.content = content;
    if (targetSeekerId !== undefined)
        updateData.seeker_id = targetSeekerId || null;
    if (noteType !== undefined)
        updateData.note_type = noteType;
    if (isPrivate !== undefined)
        updateData.is_private = isPrivate;
    if (templateKey !== undefined)
        updateData.template_key = templateKey || null;
    if (templateData !== undefined)
        updateData.template_data = templateData || {};
    const supabase = await createClient();
    const { data: note, error } = await supabase
        .from('clinical_provider_notes')
        .update(updateData)
        .eq('id', noteId)
        .eq('therapist_id', therapistId)
        .select('*')
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!note)
        return fail(404, 'Note not found');
    return ok(await attachPatient(supabase, note));
}
/** Delete a provider note owned by the therapist. */
export async function deleteProviderNote(therapistId, noteId) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('clinical_provider_notes')
        .delete()
        .eq('id', noteId)
        .eq('therapist_id', therapistId);
    if (error)
        return fail(500, error.message);
    return ok(null);
}
/** Fetch a provider note and build a JSON download payload (filename + body). */
export async function downloadProviderNote(therapistId, noteId) {
    const supabase = await createClient();
    const { data: note, error } = await supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('id', noteId)
        .eq('therapist_id', therapistId)
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!note)
        return fail(404, 'Note not found');
    const safeTitle = String(note.title || 'note')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
    const filename = `${safeTitle || 'note'}-${note.id}.json`;
    return ok({ filename, body: JSON.stringify(note, null, 2) });
}
