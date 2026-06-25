/**
 * Canonical URL map for Psychlink.pro.
 * App routes use plain folders under src/app/ (no route groups).
 */

export const routes = {
  home: "/",
  login: "/login",
  status: "/status",

  site: {
    about: "/about",
    contact: "/contact",
    forSeekers: "/for-seekers",
    marketplace: "/marketplace",
    marketplaceBrowse: "/marketplace/browse",
    pricing: "/pricing",
    privacy: "/privacy",
    terms: "/terms",
    therapists: "/therapists",
  },

  session: {
    courses: "/courses",
    course: (courseId) => `/courses/${courseId}`,
    courseLearn: (courseId) => `/courses/${courseId}/learn`,
    video: (sessionId) => `/video/${sessionId}`,
    treatmentPlan: (planId) => `/treatment-plan/${planId}`,
  },

  chat: "/chat",

  admin: {
    root: "/admin",
    analytics: "/admin/analytics",
    approvals: "/admin/approvals",
    cancellations: "/admin/cancellations",
    compliance: "/admin/compliance",
    therapists: "/admin/therapists",
    therapist: (id) => `/admin/therapists/${id}`,
    users: "/admin/users",
    user: (id) => `/admin/users/${id}`,
  },

  seeker: {
    root: "/seeker",
    billing: "/seeker/billing",
    bookings: "/seeker/bookings",
    chart: "/seeker/chart",
    chartDetail: (id) => `/seeker/chart/${id}`,
    courses: "/seeker/courses",
    course: (id) => `/seeker/courses/${id}`,
    documents: "/seeker/documents",
    note: (id) => `/seeker/notes/${id}`,
    profile: "/seeker/profile",
    session: (id) => `/seeker/sessions/${id}`,
    tasks: "/seeker/tasks",
    therapists: "/seeker/therapists",
    therapist: (id) => `/seeker/therapists/${id}`,
  },

  therapist: {
    root: "/therapist",
    billing: "/therapist/billing",
    charts: "/therapist/charts",
    clients: "/therapist/clients",
    client: (id) => `/therapist/clients/${id}`,
    clientsNew: "/therapist/clients/new",
    community: "/therapist/community",
    communityGroup: (id) => `/therapist/community/${id}`,
    courses: "/therapist/courses",
    course: (id) => `/therapist/courses/${id}`,
    courseEdit: (id) => `/therapist/courses/${id}/edit`,
    coursesNew: "/therapist/courses/new",
    notes: "/therapist/notes",
    note: (id) => `/therapist/notes/${id}`,
    notePrint: (id) => `/therapist/notes/${id}/print`,
    profile: "/therapist/profile",
    publicProfile: (id) => `/therapist/profile/${id}`,
    records: "/therapist/records",
    schedule: "/therapist/schedule",
    session: (id) => `/therapist/sessions/${id}`,
    sessionNotes: (id) => `/therapist/sessions/${id}/notes`,
    reminders: "/therapist/settings/reminders",
    subscription: "/therapist/subscription",
  },
};

/** Paths that skip auth in proxy middleware */
export const publicPathPrefixes = [
  routes.home,
  routes.login,
  routes.status,
  routes.site.about,
  routes.site.contact,
  routes.site.forSeekers,
  routes.site.marketplace,
  routes.site.pricing,
  routes.site.privacy,
  routes.site.terms,
  routes.site.therapists,
  routes.session.courses,
  "/api/auth/callback",
  "/api/courses",
  "/api/payments/webhook",
];

export function profilePath(role) {
  if (role === "admin") return routes.admin.root;
  if (role === "therapist") return routes.therapist.profile;
  if (role === "seeker") return routes.seeker.profile;
  return routes.login;
}

export function dashboardRoot(role) {
  if (role === "admin") return routes.admin.root;
  if (role === "therapist") return routes.therapist.root;
  if (role === "seeker") return routes.seeker.root;
  return routes.home;
}

export function therapistSignup(planCode) {
  const params = new URLSearchParams({ mode: "signup" });
  if (planCode) params.set("plan", planCode);
  return `${routes.login}?${params.toString()}`;
}
