import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SeekerModulePage } from '@/components/03b016ca7d68';
import { TaskStatusBadge } from '@/components/37dbbb6eba06';
import { CARE_TASK_STATUSES, isCareTaskStatus } from '@/components/984f0d44ede2';
import { parseMessageContent } from '@/components/a6e7ef5e01c9';
import { SeekerPlanSection } from '@/components/dad77a46caab';
export default async function SeekerChartPage({ searchParams, }) {
    const supabase = await createClient();
    const params = await searchParams;
    const activeTab = params.tab === 'tasks' ? 'tasks' : 'chart';
    const statusFilter = params.status || 'all';
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'seeker')
        redirect('/login');
    // ── Care tasks (now shared_tasks) ──
    const { data: careTasks } = await supabase
        .from('shared_tasks')
        .select('id, title, description, status, due_date, source, therapist_id')
        .eq('seeker_id', user.id);
    const careTaskTherapistIds = Array.from(new Set((careTasks ?? []).map((t) => t.therapist_id).filter(Boolean)));
    const { data: careTaskTherapistProfiles } = careTaskTherapistIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', careTaskTherapistIds)
        : { data: [] };
    const careTaskTherapistNameById = new Map((careTaskTherapistProfiles ?? []).map((p) => [p.user_id, p.full_name || 'Therapist']));
    // ── DB-based treatment plans visible to seeker (sent | active | archived) ──
    const { data: dbPlansRaw } = await supabase
        .from('treatment_plans')
        .select('id, therapist_id, seeker_id, status, version, plan_family_id, diagnosis_name, module_name, frequency, timeline, homework, additional_info, acknowledged_at, sent_at, goals_json, interventions_json')
        .eq('seeker_id', user.id)
        .in('status', ['sent', 'active', 'archived'])
        .order('sent_at', { ascending: false, nullsFirst: false });
    const dbPlans = (dbPlansRaw ?? []);
    // Therapist names for plans
    const therapistIds = Array.from(new Set(dbPlans.map((p) => p.therapist_id)));
    const { data: therapistProfiles } = therapistIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', therapistIds)
        : { data: [] };
    const therapistNameById = new Map((therapistProfiles ?? []).map((r) => [r.user_id, r.full_name || 'Therapist']));
    // Attachments per plan
    const planIds = dbPlans.map((p) => p.id);
    const { data: attachmentsRaw } = planIds.length
        ? await supabase
            .from('treatment_plan_attachments')
            .select('id, plan_id, file_name, file_url, file_size_bytes, mime_type, created_at')
            .in('plan_id', planIds)
        : { data: [] };
    const attachmentsByPlan = new Map();
    for (const a of attachmentsRaw ?? []) {
        const planId = String(a.plan_id);
        const arr = attachmentsByPlan.get(planId) || [];
        arr.push({
            id: String(a.id),
            fileName: String(a.file_name),
            fileUrl: String(a.file_url),
            fileSizeBytes: a.file_size_bytes ?? null,
            mimeType: a.mime_type ?? null,
            createdAt: String(a.created_at),
        });
        attachmentsByPlan.set(planId, arr);
    }
    // Plan version history (per family)
    const familyIds = Array.from(new Set(dbPlans.map((p) => p.plan_family_id).filter((x) => Boolean(x))));
    const { data: versionRows } = familyIds.length
        ? await supabase
            .from('treatment_plans')
            .select('id, plan_family_id, version, status, created_at, acknowledged_at, sent_at')
            .in('plan_family_id', familyIds)
            .order('version', { ascending: false })
        : { data: [] };
    const versionsByFamily = new Map();
    for (const v of versionRows ?? []) {
        const family = String(v.plan_family_id);
        const arr = versionsByFamily.get(family) || [];
        arr.push({
            id: String(v.id),
            version: Number(v.version),
            status: String(v.status),
            createdAt: String(v.created_at),
            acknowledgedAt: v.acknowledged_at ?? null,
            sentAt: v.sent_at ?? null,
        });
        versionsByFamily.set(family, arr);
    }
    // Build serialised plans for SeekerPlanSection
    const serialisedPlans = dbPlans.map((p) => {
        const goalsJson = Array.isArray(p.goals_json) ? p.goals_json : [];
        const interventionsJson = Array.isArray(p.interventions_json)
            ? p.interventions_json
            : [];
        const goals = goalsJson
            .slice()
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((g) => ({
            id: g.id,
            planId: p.id,
            title: g.title,
            description: g.description ?? null,
            status: g.status,
            progress: g.progress ?? 0,
            position: g.position ?? 0,
            targetDate: g.target_date ?? null,
        }));
        const objectives = goalsJson.flatMap((g) => (g.objectives ?? [])
            .slice()
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((o) => ({
            id: o.id,
            goalId: g.id,
            description: o.description,
            measurableCriteria: o.measurable_criteria ?? null,
            status: o.status ?? 'not_started',
            dueDate: o.due_date ?? null,
            position: o.position ?? 0,
        })));
        const interventions = interventionsJson
            .slice()
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((iv) => ({
            id: iv.id,
            planId: p.id,
            goalId: iv.goal_id ?? null,
            description: iv.description,
            frequency: iv.frequency ?? null,
            position: iv.position ?? 0,
        }));
        return {
            bundle: {
                plan: {
                    id: p.id,
                    status: p.status,
                    version: p.version,
                    moduleName: p.module_name,
                    planFamilyId: p.plan_family_id,
                    diagnosisName: p.diagnosis_name,
                    frequency: p.frequency,
                    timeline: p.timeline,
                    homework: p.homework,
                    additionalInfo: p.additional_info,
                    acknowledgedAt: p.acknowledged_at,
                    sentAt: p.sent_at,
                    therapistId: p.therapist_id,
                    patientId: p.seeker_id,
                },
                goals,
                objectives,
                interventions,
            },
            attachments: attachmentsByPlan.get(p.id) ?? [],
            therapistName: therapistNameById.get(p.therapist_id) || 'Therapist',
            versions: p.plan_family_id ? versionsByFamily.get(p.plan_family_id) ?? [] : [],
        };
    });
    // ── Chat-based plan sharing (legacy) ──
    const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id, content, sender_id')
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(200);
    const { data: incomingMessages } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(300);
    const { data: outgoingMessages } = await supabase
        .from('messages')
        .select('id, content, created_at, recipient_id')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(300);
    const incomingSenderIds = Array.from(new Set((incomingMessages || []).map((row) => String(row.sender_id || '').trim()).filter(Boolean)));
    // Lookup which incoming senders are therapists + their names
    const { data: incomingSenderRoles } = incomingSenderIds.length
        ? await supabase
            .from('user_roles')
            .select('id, role')
            .in('id', incomingSenderIds)
        : { data: [] };
    const therapistSenderIds = (incomingSenderRoles ?? [])
        .filter((r) => r.role === 'therapist')
        .map((r) => r.id);
    const { data: incomingSenderProfiles } = therapistSenderIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', therapistSenderIds)
        : { data: [] };
    const chatTherapistNameById = new Map((incomingSenderProfiles ?? []).map((row) => [row.user_id, row.full_name || 'Therapist']));
    const acknowledgedAtByTherapistPlan = new Map();
    for (const row of outgoingMessages || []) {
        const parsed = parseMessageContent(String(row.content || ''));
        if (parsed.type !== 'treatment_plan_ack')
            continue;
        const therapistId = String(row.recipient_id || '').trim();
        if (!therapistId)
            continue;
        const key = `${therapistId}:${parsed.chartId}`;
        const previous = acknowledgedAtByTherapistPlan.get(key);
        const candidate = String(parsed.acknowledgedAt || row.created_at || '');
        if (!previous || new Date(candidate).getTime() > new Date(previous).getTime()) {
            acknowledgedAtByTherapistPlan.set(key, candidate);
        }
    }
    // ── Task stats ──
    const allTasks = (careTasks ?? []).map((task) => ({
        id: task.id,
        title: task.title || undefined,
        description: task.description || undefined,
        status: isCareTaskStatus(task.status) ? task.status : 'pending',
        dueDate: task.due_date || undefined,
        assignedByName: careTaskTherapistNameById.get(task.therapist_id) || 'Therapist',
        source: task.source || undefined,
    }));
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = allTasks.length - completedTasks;
    const overdueTasks = allTasks.filter((t) => {
        if (t.status === 'completed' || !t.dueDate)
            return false;
        return new Date(t.dueDate) < new Date();
    }).length;
    const dueSoonTasks = allTasks.filter((t) => {
        if (t.status === 'completed' || !t.dueDate)
            return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= new Date() && dueDate <= nextWeek;
    }).length;
    let filteredTasks = allTasks;
    if (statusFilter === 'pending')
        filteredTasks = allTasks.filter((t) => t.status !== 'completed');
    if (statusFilter === 'completed')
        filteredTasks = allTasks.filter((t) => t.status === 'completed');
    filteredTasks.sort((a, b) => {
        const aCompleted = a.status === 'completed';
        const bCompleted = b.status === 'completed';
        if (aCompleted !== bCompleted)
            return aCompleted ? 1 : -1;
        if (a.dueDate && b.dueDate)
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return 0;
    });
    // ── Notifications ──
    const taskNotices = [];
    if (overdueTasks > 0)
        taskNotices.push({ tone: 'danger', text: `You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}.` });
    const completedText = completedTasks > 0 ? `${completedTasks} task${completedTasks > 1 ? 's' : ''} completed.` : null;
    if (completedText)
        taskNotices.push({ tone: 'success', text: completedText });
    let unreadTaskUpdates = 0;
    let unreadDocumentUpdates = 0;
    let unreadPlanUpdates = 0;
    const unreadPlanTherapists = new Set();
    for (const row of unreadMessages || []) {
        const parsed = parseMessageContent(String(row.content || ''));
        if (parsed.type === 'task') {
            unreadTaskUpdates += 1;
            continue;
        }
        if (parsed.type === 'attachment' || parsed.type === 'document') {
            unreadDocumentUpdates += 1;
            continue;
        }
        if (parsed.type === 'chart_snapshot' && parsed.chartKind === 'treatment_plan') {
            const senderId = String(row.sender_id || '');
            if (chatTherapistNameById.has(senderId)) {
                unreadPlanUpdates += 1;
                unreadPlanTherapists.add(senderId);
            }
        }
    }
    const incomingNotices = [];
    if (unreadTaskUpdates > 0)
        incomingNotices.push({ tone: 'warning', text: `You have ${unreadTaskUpdates} new task update${unreadTaskUpdates > 1 ? 's' : ''} in chat.` });
    if (unreadDocumentUpdates > 0)
        incomingNotices.push({ tone: 'default', text: `${unreadDocumentUpdates} new shared document${unreadDocumentUpdates > 1 ? 's are' : ' is'} waiting in chat.` });
    if (unreadPlanUpdates > 0)
        incomingNotices.push({ tone: 'default', text: `${unreadPlanUpdates} new treatment plan share${unreadPlanUpdates > 1 ? 's' : ''} from ${unreadPlanTherapists.size || 1} therapist${(unreadPlanTherapists.size || 1) > 1 ? 's' : ''}.` });
    if (dbPlans.some((p) => p.status === 'sent'))
        incomingNotices.push({ tone: 'warning', text: `You have a treatment plan awaiting your acknowledgment.` });
    // ── Legacy chat-based plan grouping ──
    const groupedPlansMap = new Map();
    for (const row of incomingMessages || []) {
        const parsed = parseMessageContent(String(row.content || ''));
        if (parsed.type !== 'chart_snapshot' || parsed.chartKind !== 'treatment_plan')
            continue;
        const therapistId = String(row.sender_id || '');
        if (!chatTherapistNameById.has(therapistId))
            continue;
        const sentAt = String(row.created_at || '');
        const chartId = parsed.chartId || `unknown-${row.id}`;
        const group = groupedPlansMap.get(therapistId) || { therapistId, therapistName: chatTherapistNameById.get(therapistId) || 'Therapist', latestSentAt: sentAt, totalShares: 0, plansByChartId: new Map() };
        group.totalShares += 1;
        if (new Date(sentAt).getTime() > new Date(group.latestSentAt).getTime())
            group.latestSentAt = sentAt;
        const currentPlan = group.plansByChartId.get(chartId);
        if (!currentPlan) {
            group.plansByChartId.set(chartId, { chartId, title: parsed.title || 'Treatment plan', preview: parsed.preview, latestSentAt: sentAt, shareCount: 1, acknowledgedAt: acknowledgedAtByTherapistPlan.get(`${therapistId}:${chartId}`) });
        }
        else {
            currentPlan.shareCount += 1;
            if (new Date(sentAt).getTime() > new Date(currentPlan.latestSentAt).getTime()) {
                currentPlan.latestSentAt = sentAt;
                currentPlan.title = parsed.title || currentPlan.title;
                currentPlan.preview = parsed.preview || currentPlan.preview;
            }
            const ackAt = acknowledgedAtByTherapistPlan.get(`${therapistId}:${chartId}`);
            if (ackAt && (!currentPlan.acknowledgedAt || new Date(ackAt).getTime() > new Date(currentPlan.acknowledgedAt).getTime()))
                currentPlan.acknowledgedAt = ackAt;
        }
        groupedPlansMap.set(therapistId, group);
    }
    const sharedTreatmentPlansByTherapist = Array.from(groupedPlansMap.values())
        .map((group) => ({ therapistId: group.therapistId, therapistName: group.therapistName, totalShares: group.totalShares, latestSentAt: group.latestSentAt, plans: Array.from(group.plansByChartId.values()).sort((a, b) => new Date(b.latestSentAt).getTime() - new Date(a.latestSentAt).getTime()) }))
        .sort((a, b) => new Date(b.latestSentAt).getTime() - new Date(a.latestSentAt).getTime());
    return (<SeekerModulePage title="Care Hub" description="View shared clinical records and complete assigned tasks in one place." actions={[
            {
                key: 'tab-chart',
                node: (<Link href="/seeker/chart?tab=chart" className={`rounded-md border px-3 py-1.5 text-sm ${activeTab === 'chart' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}>
              Records
            </Link>),
            },
            {
                key: 'tab-tasks',
                node: (<Link href="/seeker/chart?tab=tasks&status=all" className={`rounded-md border px-3 py-1.5 text-sm ${activeTab === 'tasks' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}>
              Tasks
            </Link>),
            },
            ...(activeTab === 'tasks' ? [
                { key: 'status-all', node: <Link href="/seeker/chart?tab=tasks&status=all" className={`rounded-md border px-3 py-1.5 text-sm ${statusFilter === 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}>All ({allTasks.length})</Link> },
                { key: 'status-pending', node: <Link href="/seeker/chart?tab=tasks&status=pending" className={`rounded-md border px-3 py-1.5 text-sm ${statusFilter === 'pending' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}>Pending ({pendingTasks})</Link> },
                { key: 'status-completed', node: <Link href="/seeker/chart?tab=tasks&status=completed" className={`rounded-md border px-3 py-1.5 text-sm ${statusFilter === 'completed' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}>Completed ({completedTasks})</Link> },
            ] : []),
        ]} stats={activeTab === 'tasks'
            ? [
                { label: 'Total Tasks', value: allTasks.length },
                { label: 'Pending', value: pendingTasks },
                { label: 'Completed', value: completedTasks },
                { label: 'Due This Week', value: dueSoonTasks },
            ]
            : [
                { label: 'Active Plans', value: dbPlans.filter((p) => p.status === 'active').length },
                { label: 'Pending Acknowledgment', value: dbPlans.filter((p) => p.status === 'sent').length },
            ]} notices={activeTab === 'tasks' ? [...incomingNotices, ...taskNotices] : incomingNotices} sections={activeTab === 'tasks'
            ? [
                {
                    key: 'task-list',
                    title: 'Task List',
                    content: filteredTasks.length === 0 ? (<p className="text-sm text-gray-500">
                      {statusFilter === 'completed' ? 'No completed tasks yet.' : statusFilter === 'pending' ? 'No pending tasks.' : 'No tasks assigned yet.'}
                    </p>) : (<div className="space-y-3">
                      {filteredTasks.map((task) => {
                            const isOverdue = task.dueDate && task.status !== 'completed' && new Date(task.dueDate) < new Date();
                            const isCompleted = task.status === 'completed';
                            return (<div key={task.id} className="rounded-md border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>{String(task.title || 'Untitled Task')}</p>
                                {task.description ? <p className="mt-1 text-sm text-gray-600">{String(task.description)}</p> : null}
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                                  {task.assignedByName ? <span>Assigned by {task.assignedByName}</span> : null}
                                  <TaskStatusBadge status={task.status}/>
                                  {task.dueDate ? <span className={isOverdue ? 'text-red-600' : ''}>Due {new Date(task.dueDate).toLocaleDateString()}</span> : null}
                                  {task.source ? <span className="capitalize">Source: {task.source}</span> : null}
                                  {task.category ? <span>{String(task.category)}</span> : null}
                                </div>
                              </div>
                              <form action="/api/tasks/update-status" method="POST" className="flex items-center gap-2">
                                <input type="hidden" name="taskId" value={task.id}/>
                                <input type="hidden" name="redirectTo" value={`/seeker/chart?tab=tasks&status=${statusFilter}`}/>
                                <select name="status" defaultValue={task.status} className="rounded border px-2 py-1 text-xs text-gray-700">
                                  {CARE_TASK_STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                                </select>
                                <button type="submit" className="rounded border px-2 py-1 text-xs text-gray-700">Update</button>
                              </form>
                            </div>
                          </div>);
                        })}
                    </div>),
                },
            ]
            : [
                {
                    key: 'plans',
                    title: 'Treatment Plans',
                    content: <SeekerPlanSection plans={serialisedPlans}/>,
                },
                ...(sharedTreatmentPlansByTherapist.length > 0
                    ? [{
                            key: 'shared-plan-snapshots',
                            title: 'Shared via Messages (legacy)',
                            description: 'Treatment plan snapshots shared in chat before the new system.',
                            content: (<div className="space-y-3">
                        {sharedTreatmentPlansByTherapist.map((group) => (<div key={group.therapistId} className="rounded-md border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-gray-900">{group.therapistName}</p>
                              <p className="text-xs text-gray-500">{group.totalShares} share{group.totalShares > 1 ? 's' : ''} • latest {new Date(group.latestSentAt).toLocaleString()}</p>
                            </div>
                            <div className="mt-3 space-y-2">
                              {group.plans.map((item) => (<div key={`${group.therapistId}:${item.chartId}`} className="rounded-md border bg-gray-50 p-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    <p className="text-xs text-gray-500">shared {item.shareCount} time{item.shareCount > 1 ? 's' : ''} • latest {new Date(item.latestSentAt).toLocaleString()}</p>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {item.acknowledgedAt ? (<span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Acknowledged {new Date(item.acknowledgedAt).toLocaleString()}</span>) : null}
                                  </div>
                                  {item.preview ? (<details className="mt-2 text-sm text-gray-600">
                                      <summary className="cursor-pointer text-xs font-medium text-gray-500">View snapshot details</summary>
                                      <p className="mt-2 whitespace-pre-wrap">{item.preview}</p>
                                    </details>) : null}
                                </div>))}
                            </div>
                          </div>))}
                      </div>),
                        }]
                    : []),
            ]}/>);
}
