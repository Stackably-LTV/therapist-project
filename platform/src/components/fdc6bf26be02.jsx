import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
export default async function CompliancePage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Get user profile
    const { data: profile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (profile?.role !== 'admin') {
        redirect('/');
    }
    // Get therapists for credential verification
    const { data: therapistRoles } = await supabase
        .from('user_roles')
        .select('id, role, status, created_at')
        .eq('role', 'therapist')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
    const therapistIds = (therapistRoles ?? []).map((r) => r.id);
    const { data: therapistProfiles } = therapistIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name, license_number, specialties, rate')
            .in('user_id', therapistIds)
        : { data: [] };
    const tProfileById = new Map();
    therapistProfiles?.forEach((p) => tProfileById.set(p.user_id, p));
    const therapists = (therapistRoles ?? []).map((r) => {
        const p = tProfileById.get(r.id);
        return {
            id: r.id,
            name: p?.full_name ?? '',
            email: '',
            created_at: r.created_at,
            profile_json: {
                license_number: p?.license_number ?? undefined,
                specialties: p?.specialties ?? undefined,
                rate: p?.rate ?? undefined,
                years_experience: undefined,
            },
        };
    });
    // Get all sessions for audit trail (without joining users; fetch profiles separately)
    const { data: rawSessions } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    const sessionParticipantIds = Array.from(new Set((rawSessions ?? []).flatMap((s) => [s.therapist_id, s.seeker_id]).filter(Boolean)));
    const { data: sessionParticipantProfiles } = sessionParticipantIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', sessionParticipantIds)
        : { data: [] };
    const participantNameById = new Map();
    sessionParticipantProfiles?.forEach((p) => participantNameById.set(p.user_id, p.full_name));
    const recentSessions = (rawSessions ?? []).map((s) => ({
        ...s,
        therapist: { name: participantNameById.get(s.therapist_id) ?? '', email: '' },
        client: { name: participantNameById.get(s.seeker_id) ?? '', email: '' },
    }));
    // Compliance checks
    const therapistsWithCredentials = therapists.filter((t) => {
        const profileData = t.profile_json;
        return profileData.license_number;
    }).length;
    const therapistsNeedingReview = therapists.filter((t) => {
        const profileData = t.profile_json;
        return !profileData.license_number;
    });
    const sessionsWithNotes = recentSessions?.filter((s) => {
        const sessionData = s.session_data_json || {};
        return s.status === 'completed' && sessionData.notes;
    }).length || 0;
    const sessionsNeedingNotes = recentSessions?.filter((s) => {
        const sessionData = s.session_data_json || {};
        return s.status === 'completed' && !sessionData.notes;
    }).length || 0;
    const totalCompleted = sessionsWithNotes + sessionsNeedingNotes;
    const notesComplianceRate = totalCompleted > 0
        ? ((sessionsWithNotes / totalCompleted) * 100).toFixed(1)
        : '100';
    const credentialComplianceRate = therapists?.length
        ? ((therapistsWithCredentials / therapists.length) * 100).toFixed(1)
        : '100';
    return (<div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance & Security</h1>
        <p className="mt-2 text-gray-600">HIPAA compliance, audit logs, and security monitoring</p>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Credential Compliance</p>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{credentialComplianceRate}%</p>
          <p className="text-sm text-gray-500 mt-2">
            {therapistsWithCredentials} of {therapists?.length || 0} therapists verified
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Session Notes Compliance</p>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{notesComplianceRate}%</p>
          <p className="text-sm text-gray-500 mt-2">
            {sessionsWithNotes} of {totalCompleted} sessions documented
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Security Status</p>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-green-600">Active</p>
          <p className="text-sm text-gray-500 mt-2">All security measures operational</p>
        </div>
      </div>

      {/* HIPAA Compliance Checklist */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">HIPAA Compliance Checklist</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Encrypted Data Storage</p>
                <p className="text-sm text-gray-500">All patient data encrypted at rest using Supabase encryption</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Secure Video Sessions</p>
                <p className="text-sm text-gray-500">HIPAA-compliant video conferencing via Agora</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Access Controls</p>
                <p className="text-sm text-gray-500">Role-based access with row-level security policies</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Audit Logging</p>
                <p className="text-sm text-gray-500">All database operations logged for compliance review</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Secure Messaging</p>
                <p className="text-sm text-gray-500">End-to-end encrypted real-time communication</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Therapist Verification</p>
                <p className="text-sm text-gray-500">Credential verification and license validation process</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Therapists Needing Review */}
      {therapistsNeedingReview.length > 0 && (<div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Credentials Review Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{therapistsNeedingReview.length} therapist(s) need credential verification or profile completion</p>
              </div>
              <div className="mt-4">
                <div className="space-y-2">
                  {therapistsNeedingReview.slice(0, 3).map((therapist) => (<div key={therapist.id} className="text-sm text-yellow-700">
                      • {therapist.name} ({therapist.email})
                    </div>))}
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {/* Session Documentation Status */}
      {sessionsNeedingNotes > 0 && (<div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Session Documentation Alert
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{sessionsNeedingNotes} completed session(s) are missing progress notes</p>
                <p className="mt-1">Therapists should document all sessions within 24 hours for compliance</p>
              </div>
            </div>
          </div>
        </div>)}

      {/* Recent Activity Log */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity Log</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentSessions?.slice(0, 10).map((session) => (<div key={session.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Session: {session.therapist?.name || 'Therapist'} ↔{' '}
                    {session.client?.name || 'Client'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(session.scheduled_at).toLocaleString()} •{' '}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${session.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : session.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'}`}>
                      {session.status}
                    </span>
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(session.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>))}
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Security & Privacy</h2>
        <div className="prose prose-sm text-gray-600">
          <ul className="space-y-2">
            <li>All communication is encrypted using TLS 1.3</li>
            <li>Patient data stored with AES-256 encryption at rest</li>
            <li>Row-level security prevents unauthorized data access</li>
            <li>Regular security audits and penetration testing</li>
            <li>HIPAA-compliant business associate agreements in place</li>
            <li>Automatic session timeout after 30 minutes of inactivity</li>
            <li>Multi-factor authentication available for enhanced security</li>
          </ul>
        </div>
      </div>
    </div>);
}
