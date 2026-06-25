'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/93bde5168d2a';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { Switch } from '@/components/395ec797588e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Badge } from '@/components/30348591d689';
import { TreatmentPlanBuilder } from '@/components/ea3d368c1b1b';
import { PatientChartsClient } from '@/components/98b44acc64aa';
import { TherapistNotesClient } from '@/components/dfaa3162d334';
import { PatientTasksTab } from '@/components/ea4d5ce568c2';
import TherapistSessionNotesEditor from '@/components/b713369791ee';
function formatNoteType(type) {
    if (type === 'intake')
        return 'Intake note';
    if (type === 'termination')
        return 'Termination note';
    return 'Progress note';
}
function formatDateTime(value) {
    if (!value)
        return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toLocaleString();
}
function asText(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function getSessionNotePreview(note) {
    const content = note.content_json || {};
    const preview = [
        asText(content.subjective),
        asText(content.objective),
        asText(content.presentingProblem),
        asText(content.interventions),
        asText(content.updatedPlan),
        asText(content.plan),
    ].find(Boolean);
    return preview || 'Saved session note. Open the note to view full clinical detail.';
}
export function PatientChartTabs({ patient, profile, sessions, notes, standaloneNotes = [], forms = [], tasks = [], selectedSessionNotes, initialTab, }) {
    const [isMounted, setIsMounted] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState(() => {
        const p = profile || {};
        return {
            legalFirstName: p.legal_first_name || '',
            legalMiddleName: p.legal_middle_name || '',
            legalLastName: p.legal_last_name || '',
            legalSuffix: p.legal_suffix || '',
            preferredName: p.preferred_name || '',
            pronouns: p.pronouns || '',
            dob: p.dob ? String(p.dob).slice(0, 10) : '',
            addressLine1: p.address_line1 || '',
            addressLine2: p.address_line2 || '',
            city: p.city || '',
            state: p.state || '',
            postalCode: p.postal_code || '',
            country: p.country || '',
            timeZone: p.time_zone || '',
            mobilePhone: p.mobile_phone_e164 || p.phone_e164 || '',
            mobilePhoneMessages: p.mobile_phone_messages || 'none',
            homePhone: p.home_phone_e164 || '',
            homePhoneMessages: p.home_phone_messages || 'none',
            workPhone: p.work_phone_e164 || '',
            workPhoneMessages: p.work_phone_messages || 'none',
            otherPhone: p.other_phone_e164 || '',
            otherPhoneMessages: p.other_phone_messages || 'none',
            email: p.contact_email || patient.email || '',
            administrativeSex: p.administrative_sex || 'unknown',
            languages: p.languages || [],
            sexualOrientation: p.sexual_orientation || '',
            sexualOrientationOther: p.sexual_orientation_other || '',
            genderIdentity: p.gender_identity || '',
            genderIdentityOther: p.gender_identity_other || '',
            race: p.race || '',
            raceOther: p.race_other || '',
            religion: p.religion || '',
            religionOther: p.religion_other || '',
            ethnicity: p.ethnicity || '',
            ethnicityOther: p.ethnicity_other || '',
            smokingStatus: p.smoking_status || 'unknown',
            maritalStatus: p.marital_status || 'unknown',
            employmentStatus: p.employment_status || 'unknown',
            hasPcp: Boolean(p.has_pcp),
            pcpName: p.pcp_name || '',
            pcpPhone: p.pcp_phone || '',
            pcpReleaseSigned: Boolean(p.pcp_release_signed),
            hipaaReleaseSigned: Boolean(p.hipaa_release_signed),
        };
    });
    const [patientComments, setPatientComments] = useState('');
    const [loadingComments, setLoadingComments] = useState(true);
    const [savingComments, setSavingComments] = useState(false);
    const [createFormOpen, setCreateFormOpen] = useState(false);
    const [createStandaloneNoteOpen, setCreateStandaloneNoteOpen] = useState(false);
    const [creatingSession, setCreatingSession] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        scheduledAt: '',
        durationMinutes: 60,
        sessionType: 'therapy',
        locationType: 'telehealth',
    });
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const upcomingSessions = useMemo(() => {
        const now = Date.now();
        return sessions.filter((s) => new Date(s.scheduled_at).getTime() >= now);
    }, [sessions]);
    const pastSessions = useMemo(() => {
        const now = Date.now();
        return [...sessions]
            .filter((s) => new Date(s.scheduled_at).getTime() < now)
            .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    }, [sessions]);
    useEffect(() => {
        const zip = profileForm.postalCode?.trim();
        if (!zip || zip.length < 5)
            return;
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/zipcode?zip=${encodeURIComponent(zip)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.city || data.state) {
                        setProfileForm((p) => ({
                            ...p,
                            city: data.city || p.city,
                            state: data.state || p.state,
                            country: data.country || p.country || 'US',
                        }));
                    }
                }
            }
            catch {
                // Ignore lookup errors
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [profileForm.postalCode]);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/therapist/patients/${patient.id}/comments`);
                const data = await res.json().catch(() => ({}));
                if (!cancelled && res.ok)
                    setPatientComments(String(data.comment ?? ''));
            }
            finally {
                if (!cancelled)
                    setLoadingComments(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [patient.id]);
    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            const res = await fetch(`/api/therapist/patients/${patient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || 'Failed to save patient chart');
            toast.success('Patient chart saved');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save patient chart');
        }
        finally {
            setSavingProfile(false);
        }
    };
    const saveComments = async () => {
        setSavingComments(true);
        try {
            const res = await fetch(`/api/therapist/patients/${patient.id}/comments`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: patientComments }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || 'Failed to save patient comments');
            toast.success('Patient comments saved');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save patient comments');
        }
        finally {
            setSavingComments(false);
        }
    };
    const createSession = async (overrideReason) => {
        if (!scheduleForm.scheduledAt) {
            toast.error('Pick a date/time');
            return;
        }
        setCreatingSession(true);
        try {
            const res = await fetch('/api/therapist/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: patient.id,
                    scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
                    durationMinutes: scheduleForm.durationMinutes,
                    sessionType: scheduleForm.sessionType,
                    locationType: scheduleForm.locationType,
                    conflictOverrideReason: overrideReason,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 && data?.requiresOverride) {
                const ok = window.confirm('This conflicts with a blocked time. Schedule anyway?');
                if (ok) {
                    await createSession('Override confirmed');
                }
                return;
            }
            if (!res.ok)
                throw new Error(data.error || 'Failed to schedule session');
            if (data?.requiresPayment && data?.url) {
                toast.success('Payment link sent to patient');
            }
            else {
                toast.success('Session scheduled');
            }
            window.location.reload();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to schedule session');
        }
        finally {
            setCreatingSession(false);
        }
    };
    return (isMounted ? (<Tabs defaultValue={initialTab ?? 'overview'} className="space-y-6">
        <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
          <TabsTrigger value="overview" className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="demographics" className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Info
          </TabsTrigger>
          <TabsTrigger value="forms" className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Forms
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Notes
          </TabsTrigger>
          <TabsTrigger value="treatment" className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Treatment Plan
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-xl text-gray-900">{patient.name}</CardTitle>
              <CardDescription className="text-sm text-gray-500">{patient.email}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm text-gray-600">
              {profileForm.preferredName ? <Badge variant="secondary">Preferred: {profileForm.preferredName}</Badge> : null}
              {profileForm.pronouns ? <Badge variant="secondary">Pronouns: {profileForm.pronouns}</Badge> : null}
              {profileForm.mobilePhone ? <Badge variant="secondary">Mobile: {profileForm.mobilePhone}</Badge> : null}
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-lg text-gray-900">Upcoming</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                {upcomingSessions.length} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSessions.length === 0 ? (<div className="text-sm text-gray-500">No upcoming sessions.</div>) : (upcomingSessions.slice(0, 5).map((s) => (<div key={s.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">
                        {new Date(s.scheduled_at).toLocaleString()} • {s.duration_minutes}m
                      </div>
                      <div className="text-sm text-gray-500">
                        {s.session_type || 'therapy'} • {s.location_type || 'telehealth'}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/therapist/sessions/${s.id}`}>View</Link>
                    </Button>
                  </div>)))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Patient comments</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Non-clinical notes (scheduling/billing). The patient can view this.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={patientComments} onChange={(e) => setPatientComments(e.target.value)} placeholder={loadingComments ? 'Loading...' : 'Add comment...'} rows={2} disabled={loadingComments}/>
              <div className="flex justify-end">
                <Button onClick={saveComments} disabled={loadingComments || savingComments}>
                  {savingComments ? 'Saving...' : 'Save comments'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Patient chart</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Patient information, demographics, and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900">Legal name</div>
                  <div className="text-xs text-gray-500">Use official identity documents.</div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <Input value={profileForm.legalFirstName} onChange={(e) => setProfileForm((p) => ({ ...p, legalFirstName: e.target.value }))} placeholder="First"/>
                  <Input value={profileForm.legalMiddleName} onChange={(e) => setProfileForm((p) => ({ ...p, legalMiddleName: e.target.value }))} placeholder="Middle"/>
                  <Input value={profileForm.legalLastName} onChange={(e) => setProfileForm((p) => ({ ...p, legalLastName: e.target.value }))} placeholder="Last"/>
                  <Input value={profileForm.legalSuffix} onChange={(e) => setProfileForm((p) => ({ ...p, legalSuffix: e.target.value }))} placeholder="Suffix"/>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Preferred name</Label>
                  <Input value={profileForm.preferredName} onChange={(e) => setProfileForm((p) => ({ ...p, preferredName: e.target.value }))}/>
                </div>
                <div className="space-y-2">
                  <Label>Pronouns</Label>
                  <Input value={profileForm.pronouns} onChange={(e) => setProfileForm((p) => ({ ...p, pronouns: e.target.value }))}/>
                </div>
                <div className="space-y-2">
                  <Label>DOB</Label>
                  <Input value={profileForm.dob} onChange={(e) => setProfileForm((p) => ({ ...p, dob: e.target.value }))} placeholder="1999-06-01"/>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}/>
                </div>
                <div className="space-y-2">
                  <Label>Time zone</Label>
                  <Input value={profileForm.timeZone} onChange={(e) => setProfileForm((p) => ({ ...p, timeZone: e.target.value }))} placeholder="Not set (use practice time zone)"/>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900">Contact</div>
                  <div className="text-xs text-gray-500">Primary numbers and messaging preferences.</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mobile phone</Label>
                    <Input value={profileForm.mobilePhone} onChange={(e) => setProfileForm((p) => ({ ...p, mobilePhone: e.target.value }))}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile messages</Label>
                    <Select value={profileForm.mobilePhoneMessages} onValueChange={(v) => setProfileForm((p) => ({ ...p, mobilePhoneMessages: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No messages</SelectItem>
                        <SelectItem value="voice">Voice only</SelectItem>
                        <SelectItem value="sms">Text only</SelectItem>
                        <SelectItem value="voice_sms">Voice or Text OK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Home phone</Label>
                    <Input value={profileForm.homePhone} onChange={(e) => setProfileForm((p) => ({ ...p, homePhone: e.target.value }))}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Work phone</Label>
                    <Input value={profileForm.workPhone} onChange={(e) => setProfileForm((p) => ({ ...p, workPhone: e.target.value }))}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Other phone</Label>
                    <Input value={profileForm.otherPhone} onChange={(e) => setProfileForm((p) => ({ ...p, otherPhone: e.target.value }))}/>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900">Address</div>
                  <div className="text-xs text-gray-500">Home address and location details.</div>
                </div>
                <div className="space-y-3">
                  <Input value={profileForm.addressLine1} onChange={(e) => setProfileForm((p) => ({ ...p, addressLine1: e.target.value }))} placeholder="Address line 1"/>
                  <Input value={profileForm.addressLine2} onChange={(e) => setProfileForm((p) => ({ ...p, addressLine2: e.target.value }))} placeholder="Address line 2"/>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Input value={profileForm.city} onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))} placeholder="City"/>
                    <Input value={profileForm.state} onChange={(e) => setProfileForm((p) => ({ ...p, state: e.target.value }))} placeholder="State"/>
                    <Input value={profileForm.postalCode} onChange={(e) => setProfileForm((p) => ({ ...p, postalCode: e.target.value }))} placeholder="Zip"/>
                    <Input value={profileForm.country} onChange={(e) => setProfileForm((p) => ({ ...p, country: e.target.value }))} placeholder="Country"/>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900">Background</div>
                  <div className="text-xs text-gray-500">Administrative and language details.</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Administrative sex</Label>
                    <Select value={profileForm.administrativeSex} onValueChange={(v) => setProfileForm((p) => ({ ...p, administrativeSex: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Languages</Label>
                    <Input value={profileForm.languages.join(', ')} onChange={(e) => setProfileForm((p) => ({ ...p, languages: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))} placeholder="Add language (comma-separated)"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Smoking status</Label>
                    <Select value={profileForm.smokingStatus} onValueChange={(v) => setProfileForm((p) => ({ ...p, smokingStatus: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['unknown', 'never', 'former', 'current'].map((v) => (<SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marital status</Label>
                    <Select value={profileForm.maritalStatus} onValueChange={(v) => setProfileForm((p) => ({ ...p, maritalStatus: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['unknown', 'single', 'married', 'partnered', 'divorced', 'separated', 'widowed'].map((v) => (<SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employment status</Label>
                    <Select value={profileForm.employmentStatus} onValueChange={(v) => setProfileForm((p) => ({ ...p, employmentStatus: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
            'unknown',
            'employed_full_time',
            'employed_part_time',
            'unemployed',
            'student',
            'retired',
            'disabled',
            'other',
        ].map((v) => (<SelectItem key={v} value={v}>
                            {v.replaceAll('_', ' ')}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900">Identity</div>
                  <div className="text-xs text-gray-500">Self-identified background and culture.</div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={profileForm.sexualOrientation} onChange={(e) => setProfileForm((p) => ({ ...p, sexualOrientation: e.target.value }))} placeholder="Sexual orientation"/>
                  <Input value={profileForm.genderIdentity} onChange={(e) => setProfileForm((p) => ({ ...p, genderIdentity: e.target.value }))} placeholder="Gender identity"/>
                  <Input value={profileForm.race} onChange={(e) => setProfileForm((p) => ({ ...p, race: e.target.value }))} placeholder="Race"/>
                  <Input value={profileForm.religion} onChange={(e) => setProfileForm((p) => ({ ...p, religion: e.target.value }))} placeholder="Religion"/>
                  <Input value={profileForm.ethnicity} onChange={(e) => setProfileForm((p) => ({ ...p, ethnicity: e.target.value }))} placeholder="Ethnicity"/>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-900">PCP / HIPAA</div>
                  <div className="text-xs text-gray-500">Primary care provider and releases.</div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                    <span className="text-sm text-gray-600">Has PCP</span>
                    <Switch checked={profileForm.hasPcp} onCheckedChange={(checked) => setProfileForm((p) => ({ ...p, hasPcp: checked }))}/>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                    <span className="text-sm text-gray-600">HIPAA release signed</span>
                    <Switch checked={profileForm.hipaaReleaseSigned} onCheckedChange={(checked) => setProfileForm((p) => ({ ...p, hipaaReleaseSigned: checked }))}/>
                  </div>
                  <Input value={profileForm.pcpName} onChange={(e) => setProfileForm((p) => ({ ...p, pcpName: e.target.value }))} placeholder="PCP name"/>
                  <Input value={profileForm.pcpPhone} onChange={(e) => setProfileForm((p) => ({ ...p, pcpPhone: e.target.value }))} placeholder="PCP phone"/>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 md:col-span-2">
                    <span className="text-sm text-gray-600">PCP release signed</span>
                    <Switch checked={profileForm.pcpReleaseSigned} onCheckedChange={(checked) => setProfileForm((p) => ({ ...p, pcpReleaseSigned: checked }))}/>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save to chart'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">Forms</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Create and manage forms for this patient.
                </CardDescription>
              </div>
              <Button onClick={() => setCreateFormOpen(true)} className="h-10 px-4">
                New form
              </Button>
            </CardHeader>
            <CardContent>
              <PatientChartsClient initialCharts={forms} clients={[{ id: patient.id, name: patient.name, email: patient.email }]} hideHeader fixedPatientId={patient.id} hidePatientRow createOpen={createFormOpen} onCreateOpenChange={setCreateFormOpen}/>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Schedule from chart</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Create an appointment for this patient.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date/time</Label>
                <Input type="datetime-local" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={String(scheduleForm.durationMinutes)} onValueChange={(v) => setScheduleForm((p) => ({ ...p, durationMinutes: Number(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90].map((m) => (<SelectItem key={m} value={String(m)}>
                        {m} minutes
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Session type</Label>
                <Select value={scheduleForm.sessionType} onValueChange={(v) => setScheduleForm((p) => ({ ...p, sessionType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
            { v: 'initial_intake_90', l: 'Initial 90-minute intake' },
            { v: 'therapy', l: 'Regular therapy session' },
            { v: 'group_therapy', l: 'Group therapy' },
            { v: 'consultation', l: 'Consultation' },
            { v: 'intake', l: 'Intake' },
            { v: 'psych_eval', l: 'Psych evaluation' },
            { v: 'other', l: 'Other' },
        ].map((o) => (<SelectItem key={o.v} value={o.v}>
                        {o.l}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telehealth</Label>
                <Select value={scheduleForm.locationType} onValueChange={(v) => setScheduleForm((p) => ({ ...p, locationType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telehealth">Telehealth</SelectItem>
                    <SelectItem value="in_person">In person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={() => void createSession()} disabled={creatingSession}>
                  {creatingSession ? 'Scheduling...' : 'Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-lg text-gray-900">Previous schedules</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Past appointments for this patient.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastSessions.length === 0 ? (<div className="text-sm text-gray-500">No past sessions.</div>) : (pastSessions.map((s) => (<div key={s.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">
                        {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes}m
                      </div>
                      <div className="text-sm text-gray-500">
                        {s.session_type || 'therapy'} · {s.location_type || 'telehealth'}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/therapist/sessions/${s.id}`}>View</Link>
                    </Button>
                  </div>)))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">Notes</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Session notes and standalone notes for this patient.
                </CardDescription>
              </div>
              <Button size="sm" className="h-9 px-4" onClick={() => setCreateStandaloneNoteOpen(true)}>
                New note
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedSessionNotes ? (<div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-blue-950">Editing session note inside patient record</h4>
                      <p className="mt-1 text-xs text-blue-800">
                        This saves to the same synced record shown below.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="bg-white">
                      <Link href={`/therapist/clients/${patient.id}?tab=notes`}>Close editor</Link>
                    </Button>
                  </div>
                  <TherapistSessionNotesEditor session={{
                id: selectedSessionNotes.session.id,
                scheduledAt: selectedSessionNotes.session.scheduled_at,
                durationMinutes: Number(selectedSessionNotes.session.duration_minutes || 50),
                status: selectedSessionNotes.session.status || 'scheduled',
                sessionType: selectedSessionNotes.session.session_type || 'therapy',
                locationType: selectedSessionNotes.session.location_type || 'telehealth',
                locationLabel: selectedSessionNotes.session.location_label || '',
                telehealthUrl: selectedSessionNotes.session.telehealth_url || '',
            }} client={{ id: patient.id, name: patient.name, email: patient.email }} therapistName={selectedSessionNotes.therapistName} initialNotes={(selectedSessionNotes.session.session_data_json || {}).notes ||
                null} existingNotes={selectedSessionNotes.existingNotes} serviceCodes={selectedSessionNotes.serviceCodes}/>
                </div>) : null}

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Standalone notes</h4>
                <TherapistNotesClient initialNotes={standaloneNotes || []} clients={[{ id: patient.id, name: patient.name, email: patient.email }]} preselectedPatientId={patient.id} hideHeader createOpen={createStandaloneNoteOpen} onCreateOpenChange={setCreateStandaloneNoteOpen}/>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Session notes</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    These sync from the session notes editor and are saved in this patient record.
                  </p>
                </div>
                {notes.length === 0 ? (<div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm text-gray-500">
                    No session notes yet.
                  </div>) : (notes.map((n) => {
            const session = sessions.find((s) => s.id === n.session_id);
            return (<div key={`${n.session_id}:${n.note_type}`} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-gray-900">{formatNoteType(n.note_type)}</div>
                            <Badge variant={n.status === 'signed' ? 'default' : 'secondary'} className="capitalize">
                              {n.status}
                            </Badge>
                            {n.version ? <Badge variant="outline">v{n.version}</Badge> : null}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session?.scheduled_at ? `Session ${formatDateTime(session.scheduled_at)} · ` : ''}
                            Updated {formatDateTime(n.updated_at)}
                            {n.signed_at ? ` · Signed ${formatDateTime(n.signed_at)}` : ''}
                          </div>
                          <p className="line-clamp-2 text-sm text-gray-700">{getSessionNotePreview(n)}</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <Link href={`/therapist/clients/${patient.id}?tab=notes&session=${n.session_id}`}>
                            Open synced note
                          </Link>
                        </Button>
                      </div>);
        }))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-6">
          <TreatmentPlanBuilder patientId={patient.id}/>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <PatientTasksTab clientId={patient.id} clientName={patient.name} initialTasks={tasks}/>
        </TabsContent>
      </Tabs>) : (<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-500">Loading chart...</div>
      </div>));
}
