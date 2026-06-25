export const PROGRESS_MSE_FIELDS = [
    'generalAppearance',
    'motorActivity',
    'behavior',
    'speech',
    'mood',
    'affect',
    'insight',
    'judgment',
    'memory',
    'attention',
    'thoughtProcess',
    'thoughtContent',
    'perception',
    'functionalStatus',
];
export const PROGRESS_MSE_OPTIONS = {
    generalAppearance: ['not_assessed', 'well_groomed', 'disheveled', 'bizarre', 'appropriate', 'inappropriate', 'poor_hygiene'],
    motorActivity: ['not_assessed', 'normal', 'agitated', 'retarded', 'restless', 'tremor', 'tics', 'rigid'],
    behavior: ['not_assessed', 'cooperative', 'uncooperative', 'guarded', 'hostile', 'withdrawn', 'dramatic'],
    speech: ['not_assessed', 'normal', 'pressured', 'slow', 'loud', 'soft', 'monotone', 'slurred', 'rapid'],
    mood: ['not_assessed', 'euthymic', 'depressed', 'anxious', 'irritable', 'euphoric', 'angry', 'hopeless'],
    affect: ['not_assessed', 'appropriate', 'flat', 'blunted', 'constricted', 'labile', 'incongruent'],
    insight: ['not_assessed', 'good', 'fair', 'poor', 'absent'],
    judgment: ['not_assessed', 'good', 'fair', 'poor', 'impaired'],
    memory: ['not_assessed', 'intact', 'impaired_recent', 'impaired_remote', 'impaired_immediate'],
    attention: ['not_assessed', 'intact', 'distractible', 'impaired', 'hypervigilant'],
    thoughtProcess: ['not_assessed', 'linear', 'tangential', 'circumstantial', 'loose_associations', 'flight_of_ideas'],
    thoughtContent: ['not_assessed', 'appropriate', 'delusions', 'obsessions', 'phobias', 'ideas_of_reference', 'paranoid'],
    perception: ['not_assessed', 'normal', 'hallucinations_auditory', 'hallucinations_visual', 'illusions', 'derealization'],
    functionalStatus: ['not_assessed', 'independent', 'minimal_assistance', 'moderate_assistance', 'dependent', 'impaired'],
};
export function emptyProgressNoteData() {
    return {
        meta: {
            clinicianName: '',
            startAt: undefined,
            endAt: undefined,
            durationMinutes: undefined,
            serviceCode: '',
            location: '',
            participants: '',
        },
        subjective: '',
        objective: '',
        mentalStatus: {},
        riskAssessment: { deniesAll: true, details: '' },
        interventions: '',
        response: '',
        assessment: '',
        plan: '',
        homework: '',
        medicationsReviewed: '',
        nextAppointment: '',
        signOff: { signed: false },
    };
}
function section(title, body) {
    const trimmed = body.trim();
    if (!trimmed)
        return '';
    return `## ${title}\n\n${trimmed}\n\n`;
}
function formatRange(meta) {
    const start = meta?.startAt ? Date.parse(meta.startAt) : NaN;
    const end = meta?.endAt ? Date.parse(meta.endAt) : NaN;
    if (!Number.isFinite(start))
        return '';
    const startD = new Date(start);
    const startLabel = startD.toLocaleString('en-US');
    if (!Number.isFinite(end))
        return startLabel;
    const endD = new Date(end);
    const endLabel = endD.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${startLabel} – ${endLabel}`;
}
export function renderProgressNoteMarkdown(data) {
    const lines = [];
    lines.push('# Progress Note\n');
    const metaParts = [];
    if (data.meta?.clinicianName)
        metaParts.push(`Clinician: ${data.meta.clinicianName}`);
    const dt = formatRange(data.meta);
    if (dt)
        metaParts.push(`Date/time: ${dt}`);
    if (data.meta?.serviceCode)
        metaParts.push(`Service code: ${data.meta.serviceCode}`);
    if (data.meta?.location)
        metaParts.push(`Location: ${data.meta.location}`);
    if (data.meta?.participants)
        metaParts.push(`Participants: ${data.meta.participants}`);
    if (data.meta?.durationMinutes)
        metaParts.push(`Duration: ${data.meta.durationMinutes} minutes`);
    if (metaParts.length)
        lines.push(metaParts.join(' · ') + '\n');
    lines.push(section('Subjective', data.subjective));
    lines.push(section('Objective', data.objective));
    const msKeys = Object.keys(data.mentalStatus || {});
    if (msKeys.length) {
        const ms = msKeys
            .sort()
            .map((k) => `- **${k}**: ${String(data.mentalStatus[k] || '').trim()}`)
            .filter((s) => !s.endsWith(': '))
            .join('\n');
        if (ms)
            lines.push(section('Mental Status Exam', ms));
    }
    if (data.riskAssessment?.deniesAll) {
        lines.push(section('Risk Assessment', 'Patient denies SI/HI/self-harm/violence.'));
    }
    else if (data.riskAssessment?.details?.trim()) {
        lines.push(section('Risk Assessment', data.riskAssessment.details));
    }
    lines.push(section('Interventions', data.interventions));
    lines.push(section('Response to Interventions', data.response));
    lines.push(section('Assessment', data.assessment));
    lines.push(section('Plan', data.plan));
    lines.push(section('Homework / Between-Session Tasks', data.homework));
    lines.push(section('Medications Reviewed', data.medicationsReviewed));
    lines.push(section('Next Appointment', data.nextAppointment));
    if (data.signOff?.signed) {
        lines.push(section('Signature', `Signed${data.signOff.signedAt ? ` at ${data.signOff.signedAt}` : ''}.`));
    }
    return lines.join('\n').trim() + '\n';
}
