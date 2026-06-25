import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import PrintTrigger from '@/components/e25bc64ee08a';
export const dynamic = 'force-dynamic';
const goalStatusLabel = {
    not_started: 'Not started',
    in_progress: 'In progress',
    achieved: 'Achieved',
    revised: 'Revised',
    discontinued: 'Discontinued',
};
export default async function TreatmentPlanPrintPage({ params }) {
    const { planId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: plan } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();
    if (!plan || plan.seeker_id !== user.id)
        redirect('/login');
    const goals = Array.isArray(plan.goals_json)
        ? plan.goals_json.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        : [];
    const interventions = Array.isArray(plan.interventions_json)
        ? plan.interventions_json.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        : [];
    const { data: rawAttachments } = await supabase
        .from('treatment_plan_attachments')
        .select('id, file_name, file_url, file_size_bytes')
        .eq('plan_id', planId);
    const BUCKET = 'treatment-plan-attachments';
    const storage = createServiceRoleClient();
    const attachments = await Promise.all((rawAttachments ?? []).map(async (a) => {
        const path = String(a.file_url || '').replace(`${BUCKET}/`, '');
        const { data } = await storage.storage.from(BUCKET).createSignedUrl(path, 3600);
        return {
            id: a.id,
            fileName: a.file_name,
            fileSizeBytes: a.file_size_bytes ?? null,
            signedUrl: data?.signedUrl ?? null,
        };
    }));
    return (<>
      <style>{`
        body { background: #f4f4f5; }
        .tp-page { max-width: 740px; margin: 0 auto; padding: 32px 40px; background: #fff; font-family: Georgia, serif; font-size: 12pt; color: #111; box-shadow: 0 2px 16px rgba(0,0,0,.10); min-height: 100vh; }
        .tp-title { font-size: 20pt; margin-bottom: 4px; }
        .tp-meta { font-size: 10pt; color: #555; margin-bottom: 24px; }
        .tp-badge { display: inline-block; font-size: 9pt; padding: 2px 10px; border-radius: 12px; border: 1px solid #aaa; }
        .tp-h2 { font-size: 13pt; margin: 24px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; font-family: Georgia, serif; }
        .tp-field { margin-bottom: 12px; }
        .tp-field-label { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 3px; }
        .tp-goal { border: 1px solid #ddd; border-radius: 6px; padding: 14px; margin-bottom: 12px; break-inside: avoid; }
        .tp-goal h3 { font-size: 11pt; margin-bottom: 4px; }
        .tp-progress { height: 6px; background: #eee; border-radius: 3px; margin: 6px 0; }
        .tp-progress-fill { height: 100%; background: #4f46e5; border-radius: 3px; }
        .tp-obj { font-size: 10pt; padding: 4px 0 4px 12px; border-left: 2px solid #e5e7eb; margin: 4px 0; }
        .tp-iv { padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 10pt; }
        .tp-att { padding: 4px 0; font-size: 10pt; }
        .tp-footer { margin-top: 32px; font-size: 9pt; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }
        .tp-print-btn { display: block; margin-bottom: 18px; padding: 8px 22px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 11pt; }
        @media print {
          body { background: #fff !important; }
          .tp-page { box-shadow: none; padding: 0; }
          .tp-print-btn { display: none !important; }
        }
      `}</style>

      <PrintTrigger />

      <div className="tp-page">
        <h1 className="tp-title">{plan.diagnosis_name || 'Treatment Plan'}</h1>
        <p className="tp-meta">
          v{plan.version}&nbsp;·&nbsp;
          <span className="tp-badge">{plan.status}</span>
          {plan.acknowledged_at && (<>&nbsp;·&nbsp;Acknowledged: {new Date(plan.acknowledged_at).toLocaleDateString()}</>)}
          {plan.sent_at && (<>&nbsp;·&nbsp;Sent: {new Date(plan.sent_at).toLocaleDateString()}</>)}
        </p>

        <h2 className="tp-h2">Plan Details</h2>
        {plan.frequency && (<div className="tp-field">
            <div className="tp-field-label">Session Frequency</div>
            <p>{plan.frequency}</p>
          </div>)}
        {plan.timeline && (<div className="tp-field">
            <div className="tp-field-label">Timeline</div>
            <p>{plan.timeline}</p>
          </div>)}
        {plan.homework && (<div className="tp-field">
            <div className="tp-field-label">Homework / Between-Session Work</div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{plan.homework}</p>
          </div>)}
        {plan.additional_info && (<div className="tp-field">
            <div className="tp-field-label">Additional Information</div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{plan.additional_info}</p>
          </div>)}
        {plan.discharge_plan && (<div className="tp-field">
            <div className="tp-field-label">Discharge Plan</div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{plan.discharge_plan}</p>
          </div>)}

        {goals.length > 0 && (<>
            <h2 className="tp-h2">Goals &amp; Objectives</h2>
            {goals.map((goal) => {
                const goalObjs = (goal.objectives ?? [])
                    .slice()
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
                return (<div key={goal.id} className="tp-goal">
                  <h3>{goal.title}</h3>
                  {goal.description && (<p style={{ fontSize: '10pt', color: '#444', marginTop: '4px' }}>{goal.description}</p>)}
                  <p style={{ fontSize: '9pt', color: '#666', marginTop: '6px' }}>
                    {goalStatusLabel[goal.status] ?? goal.status} &nbsp;·&nbsp; Progress: {goal.progress ?? 0}%
                    {goal.target_date && <> &nbsp;·&nbsp; Target: {goal.target_date}</>}
                  </p>
                  <div className="tp-progress">
                    <div className="tp-progress-fill" style={{ width: `${goal.progress ?? 0}%` }}/>
                  </div>
                  {goalObjs.length > 0 && (<>
                      <p style={{ fontSize: '9pt', fontWeight: 'bold', marginTop: '8px', marginBottom: '4px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Objectives
                      </p>
                      {goalObjs.map((obj) => (<div key={obj.id} className="tp-obj">
                          <p>{obj.description}</p>
                          {obj.measurable_criteria && <p style={{ color: '#555' }}>Criteria: {obj.measurable_criteria}</p>}
                          {obj.due_date && <p style={{ color: '#555' }}>Due: {obj.due_date}</p>}
                        </div>))}
                    </>)}
                </div>);
            })}
          </>)}

        {interventions.length > 0 && (<>
            <h2 className="tp-h2">Interventions</h2>
            {interventions.map((iv) => {
                const linkedGoal = iv.goal_id ? goals.find((g) => g.id === iv.goal_id) : null;
                return (<div key={iv.id} className="tp-iv">
                  <p>{iv.description}</p>
                  <p style={{ fontSize: '9pt', color: '#666' }}>
                    {iv.frequency && <>Frequency: {iv.frequency}</>}
                    {iv.frequency && linkedGoal && ' · '}
                    {linkedGoal && <>Goal: {linkedGoal.title}</>}
                  </p>
                </div>);
            })}
          </>)}

        {attachments.length > 0 && (<>
            <h2 className="tp-h2">Attachments</h2>
            {attachments.map((a) => (<div key={a.id} className="tp-att">
                {a.signedUrl ? (<a href={a.signedUrl} target="_blank" rel="noopener noreferrer">
                    {a.fileName}
                  </a>) : (<span>{a.fileName}</span>)}
                {a.fileSizeBytes && (<span style={{ color: '#888', marginLeft: '8px', fontSize: '9pt' }}>
                    ({Math.round(a.fileSizeBytes / 1024)} KB)
                  </span>)}
              </div>))}
          </>)}

        <p className="tp-footer">
          Printed from PsycheConnect — {new Date().toLocaleString()}
        </p>
      </div>
    </>);
}
