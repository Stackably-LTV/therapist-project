export function emptyIntakeNoteData() {
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
        presentingProblem: '',
        objectiveContent: '',
        plan: '',
        diagnosis: { primaryIcd10: '', primaryIcd10Name: '', description: '', justification: '' },
        currentMentalStatus: {},
        riskAssessment: {
            deniesAll: true,
            areas: [],
        },
        biopsychosocial: {},
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
export function renderIntakeNoteMarkdown(data) {
    const lines = [];
    lines.push('# Intake Note\n');
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
    lines.push(section('Presenting Problem', data.presentingProblem));
    const msKeys = Object.keys(data.currentMentalStatus || {});
    if (msKeys.length) {
        const ms = msKeys
            .sort()
            .map((k) => `- **${k}**: ${String(data.currentMentalStatus[k] || '').trim()}`)
            .filter((s) => !s.endsWith(': '))
            .join('\n');
        lines.push(section('Current Mental Status', ms));
    }
    if (data.riskAssessment?.deniesAll) {
        lines.push(section('Risk Assessment', 'Patient denies all areas of risk.'));
    }
    else if (data.riskAssessment?.areas?.length) {
        const blocks = data.riskAssessment.areas
            .map((a, idx) => {
            const parts = [];
            parts.push(`### Area ${idx + 1}: ${a.area || 'Unspecified'}`);
            if (a.level)
                parts.push(`- **Level**: ${a.level}`);
            if (a.intentToAct)
                parts.push(`- **Intent to act**: ${a.intentToAct}`);
            if (a.planToAct)
                parts.push(`- **Plan to act**: ${a.planToAct}`);
            if (a.meansToAct)
                parts.push(`- **Means to act**: ${a.meansToAct}`);
            if (a.riskFactors?.trim())
                parts.push(`- **Risk factors**: ${a.riskFactors.trim()}`);
            if (a.protectiveFactors?.trim())
                parts.push(`- **Protective factors**: ${a.protectiveFactors.trim()}`);
            if (a.additionalDetails?.trim())
                parts.push(`- **Additional details**: ${a.additionalDetails.trim()}`);
            return parts.join('\n');
        })
            .join('\n\n');
        lines.push(section('Risk Assessment', blocks));
    }
    lines.push(section('Objective Content', data.objectiveContent));
    const bioKeys = Object.keys(data.biopsychosocial || {});
    if (bioKeys.length) {
        const bio = bioKeys
            .sort()
            .map((k) => `- **${k}**: ${String(data.biopsychosocial[k] || '').trim()}`)
            .filter((s) => !s.endsWith(': '))
            .join('\n');
        lines.push(section('Biopsychosocial Assessment', bio));
    }
    lines.push(section('Plan', data.plan));
    const dxParts = [];
    if (data.diagnosis?.primaryIcd10?.trim()) {
        const code = data.diagnosis.primaryIcd10.trim();
        const name = String(data.diagnosis?.primaryIcd10Name || '').trim();
        dxParts.push(`- **Primary ICD-10**: ${name ? `${code} — ${name}` : code}`);
    }
    if (data.diagnosis?.description?.trim())
        dxParts.push(`- **Description**: ${data.diagnosis.description.trim()}`);
    if (data.diagnosis?.justification?.trim())
        dxParts.push(`- **Diagnostic justification**: ${data.diagnosis.justification.trim()}`);
    if (dxParts.length)
        lines.push(section('Diagnosis', dxParts.join('\n')));
    if (data.signOff?.signed) {
        lines.push(section('Signature', `Signed${data.signOff.signedAt ? ` at ${data.signOff.signedAt}` : ''}.`));
    }
    return lines.join('\n').trim() + '\n';
}
