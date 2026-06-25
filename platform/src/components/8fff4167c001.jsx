import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import { emptyIntakeNoteData } from '@/components/a68a034eeea3';
function escapeHtml(s) {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
export default async function TherapistNotePrintPage({ params }) {
    const { noteId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: userRow } = await supabase.from('user_roles').select('role').eq('id', user.id).single();
    if (!userRow || userRow.role !== 'therapist')
        notFound();
    const { data: rawNote, error } = await supabase
        .from('clinical_provider_notes')
        .select('*')
        .eq('id', noteId)
        .eq('therapist_id', user.id)
        .single();
    if (error || !rawNote)
        notFound();
    const patientIdForLookup = rawNote?.seeker_id;
    let patientName = '';
    if (patientIdForLookup) {
        const { data: patientProfile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', patientIdForLookup)
            .single();
        patientName = patientProfile?.full_name ?? '';
    }
    const note = { ...rawNote, patient: { id: patientIdForLookup, name: patientName, email: '' } };
    const isIntake = note.note_type === 'intake';
    const intakeData = isIntake
        ? { ...emptyIntakeNoteData(), ...(note.template_data || {}) }
        : emptyIntakeNoteData();
    const formatRange = (meta) => {
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
    };
    const fieldRow = (label, value) => {
        if (value == null || String(value).trim().length === 0)
            return '';
        return `<div class="field"><div class="field-label">${escapeHtml(label)}</div><div class="field-value">${escapeHtml(String(value))}</div></div>`;
    };
    const textBlock = (label, value) => {
        if (!value || value.trim().length === 0)
            return '';
        return `<div class="block"><div class="block-title">${escapeHtml(label)}</div><div class="block-body">${escapeHtml(value).replaceAll('\n', '<br />')}</div></div>`;
    };
    const buildIntakeHtml = (data) => {
        const meta = data.meta || {};
        const metaHtml = `
      <div class="meta-grid">
        ${fieldRow('Clinician', meta.clinicianName)}
        ${fieldRow('Patient', note.patient?.name || '')}
        ${fieldRow('Date/time', formatRange(meta))}
        ${fieldRow('Duration (minutes)', meta.durationMinutes ?? '')}
        ${fieldRow('Service code', meta.serviceCode)}
        ${fieldRow('Location', meta.location)}
        ${fieldRow('Participants', meta.participants)}
      </div>
    `;
        const mentalStatusEntries = Object.entries(data.currentMentalStatus || {})
            .filter(([, v]) => String(v || '').trim().length > 0)
            .map(([k, v]) => `<div class="field"><div class="field-label">${escapeHtml(k)}</div><div class="field-value">${escapeHtml(String(v))}</div></div>`)
            .join('');
        const riskHtml = data.riskAssessment?.deniesAll
            ? `<div class="block-body">Patient denies all areas of risk.</div>`
            : (data.riskAssessment?.areas || [])
                .map((area, idx) => `
            <div class="risk-card">
              <div class="risk-title">Area ${idx + 1}: ${escapeHtml(area.area || 'Unspecified')}</div>
              <div class="risk-grid">
                ${fieldRow('Level', area.level)}
                ${fieldRow('Intent to act', area.intentToAct)}
                ${fieldRow('Plan to act', area.planToAct)}
                ${fieldRow('Means to act', area.meansToAct)}
                ${fieldRow('Risk factors', area.riskFactors)}
                ${fieldRow('Protective factors', area.protectiveFactors)}
                ${fieldRow('Additional details', area.additionalDetails)}
              </div>
            </div>
          `)
                .join('') || '<div class="block-body">No risk assessment recorded.</div>';
        const biopsychosocialHtml = Object.entries(data.biopsychosocial || {})
            .filter(([, v]) => String(v || '').trim().length > 0)
            .map(([k, v]) => `<div class="field"><div class="field-label">${escapeHtml(k)}</div><div class="field-value">${escapeHtml(String(v))}</div></div>`)
            .join('');
        const dxCode = String(data.diagnosis?.primaryIcd10 || '').trim();
        const dxName = String(data.diagnosis?.primaryIcd10Name || '').trim();
        const diagnosisHtml = `
      ${fieldRow('Primary ICD-10', dxCode ? (dxName ? `${dxCode} — ${dxName}` : dxCode) : '')}
      ${fieldRow('Description', data.diagnosis?.description)}
      ${fieldRow('Diagnostic justification', data.diagnosis?.justification)}
    `;
        const signatureHtml = data.signOff?.signed
            ? `<div class="field"><div class="field-label">Signature</div><div class="field-value">Signed${data.signOff.signedAt ? ` at ${escapeHtml(data.signOff.signedAt)}` : ''}.</div></div>`
            : '';
        return `
      ${metaHtml}
      ${textBlock('Presenting problem', data.presentingProblem)}
      ${mentalStatusEntries ? `<div class="block"><div class="block-title">Current mental status</div><div class="grid">${mentalStatusEntries}</div></div>` : ''}
      <div class="block"><div class="block-title">Risk assessment</div>${riskHtml}</div>
      ${textBlock('Objective content', data.objectiveContent)}
      ${biopsychosocialHtml ? `<div class="block"><div class="block-title">Biopsychosocial assessment</div><div class="grid">${biopsychosocialHtml}</div></div>` : ''}
      ${textBlock('Plan', data.plan)}
      ${diagnosisHtml.trim().length ? `<div class="block"><div class="block-title">Diagnosis</div><div class="grid">${diagnosisHtml}</div></div>` : ''}
      ${signatureHtml ? `<div class="block"><div class="grid">${signatureHtml}</div></div>` : ''}
    `;
    };
    const fallbackHtml = escapeHtml(String(note.content || '')).replaceAll('\n', '<br />');
    const html = isIntake
        ? buildIntakeHtml(intakeData)
        : `<div class="block"><div class="block-title">Note</div><div class="block-body">${fallbackHtml}</div></div>`;
    return (<html>
      <head>
        <title>{note.title}</title>
        <script 
    // Attach click handler without React event props (server component safe).
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function ready(fn) {
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', fn);
                  } else {
                    fn();
                  }
                }
                ready(function () {
                  var btn = document.getElementById('print-btn');
                  if (!btn) return;
                  btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    window.print();
                  });
                });
              })();
            `,
        }}/>
        <style 
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
            __html: `
              @media print {
                .no-print { display: none !important; }
                body { margin: 0; }
              }
              body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #111827; background: #f8fafc; }
              .page { max-width: 860px; margin: 28px auto; padding: 0 16px; }
              .paper { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 22px; }
              .doc-header { border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 14px; }
              .doc-title { font-size: 22px; font-weight: 700; letter-spacing: 0.02em; }
              .doc-subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
              .meta { color: #6b7280; font-size: 12px; margin: 8px 0 14px; }
              .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
              .block { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px; }
              .block-title { font-weight: 600; font-size: 13px; margin-bottom: 8px; color: #111827; text-transform: uppercase; letter-spacing: 0.08em; }
              .block-body { font-size: 13px; color: #111827; line-height: 1.6; }
              .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
              .field { border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 10px; background: #fff; }
              .field-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
              .field-value { font-size: 13px; color: #111827; white-space: pre-wrap; }
              .risk-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; margin-bottom: 10px; }
              .risk-title { font-weight: 600; font-size: 13px; margin-bottom: 8px; color: #111827; }
              .risk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
              @media (max-width: 640px) { .grid, .meta-grid, .risk-grid { grid-template-columns: 1fr; } }
            `,
        }}/>
      </head>
      <body>
        <div className="page">
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <a href={`/therapist/notes/${note.id}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>
              Back to editor
            </a>
            <button id="print-btn" type="button" style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}>
              Print / Save PDF
            </button>
          </div>

          <div className="paper">
            <div className="doc-header">
              <div className="doc-title">{isIntake ? 'Intake Note' : note.title}</div>
              <div className="doc-subtitle">
                Description: {isIntake ? 'Intake note (structured template)' : 'Clinical note'}
              </div>
            </div>
            <div className="meta">
              {note.patient ? `Patient: ${note.patient.name} · ` : ''}
              Updated {new Date(note.updated_at).toLocaleString('en-US')}
            </div>
            <div 
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{ __html: html }}/>
          </div>
        </div>
      </body>
    </html>);
}
