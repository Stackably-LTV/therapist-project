import posthog from "posthog-js";
// Runs once on the client before the app hydrates (Next.js client instrumentation).
// Routed through the /ingest reverse proxy (see next.config.ts) so ad-blockers
// don't silently drop analytics in production.
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
});
