export const THERAPIST_FEATURES = [
    'profile',
    'contact',
    'rtc_sessions',
    'direct_messaging',
    'recorded_sessions',
    'course_creation',
    'task_assignments',
    'colleague_consulting',
    'session_notes',
    'charts',
    'billing',
    'practice_management',
];
export const THERAPIST_FEATURE_META = {
    profile: {
        label: 'Public therapist profile',
        description: 'A discoverable profile with your bio, specialties, and photo.',
    },
    contact: {
        label: 'Direct contact info',
        description: 'Display your phone and email so seekers can reach out directly.',
    },
    rtc_sessions: {
        label: 'Live video sessions',
        description: 'Run secure HIPAA-eligible video sessions inside Psychlink.',
    },
    direct_messaging: {
        label: 'Direct messaging with clients',
        description: 'Real-time chat with clients between sessions.',
    },
    recorded_sessions: {
        label: 'Recorded session playback',
        description: 'Optionally record sessions for client review and supervision.',
    },
    course_creation: {
        label: 'Create & assign courses',
        description: 'Build psychoeducation courses and assign them to clients.',
    },
    task_assignments: {
        label: 'Client task assignments',
        description: 'Assign homework, journals, and worksheets between sessions.',
    },
    colleague_consulting: {
        label: 'Colleague consulting groups',
        description: 'Private groups + forums for case consultation with peers.',
    },
    session_notes: {
        label: 'Progress & session notes',
        description: 'SOAP / DAP notes templates with timeline view.',
    },
    charts: {
        label: 'Patient charts & records',
        description: 'Centralised client charts with intake, diagnosis, and history.',
    },
    billing: {
        label: 'Insurance & billing management',
        description: 'Track claims, invoices, copays, and superbills.',
    },
    practice_management: {
        label: 'Full practice management',
        description: 'Scheduling, payouts, reports, and team workflows in one place.',
    },
};
export function hasTherapistFeature(features, feature) {
    if (!features)
        return false;
    for (const f of features) {
        if (f === feature)
            return true;
    }
    return false;
}
