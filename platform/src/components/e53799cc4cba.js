export function getInitialCourseEditorTab(hash) {
    return hash === '#assignments' ? 'settings' : 'content';
}
export function normalizeCourseEditorPatient(row) {
    const patient = row.patient ?? null;
    const id = String(row.seeker_id ?? row.patient_id ?? row.id ?? '');
    const name = String(row.full_name ?? row.name ?? patient?.name ?? '');
    const email = String(row.email ?? patient?.email ?? '');
    return { id, name, email };
}
export function normalizeAssignmentRow(row) {
    const seeker = row.seeker ?? null;
    const client = row.client ?? null;
    const clientId = String(row.seeker_id ?? row.client_id ?? '');
    const clientName = String(seeker?.full_name ?? client?.name ?? row.client_name ?? clientId);
    return {
        ...row,
        id: String(row.id ?? ''),
        clientId,
        clientName,
    };
}
export function toImageBlockPayload(current, updates) {
    return {
        ...current,
        ...(updates.url !== undefined ? { url: updates.url.trim() } : {}),
        ...(updates.alt !== undefined ? { alt: updates.alt.trim() || null } : {}),
        ...(updates.caption !== undefined ? { caption: updates.caption.trim() || null } : {}),
    };
}
