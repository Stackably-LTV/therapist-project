const nextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.psychlink.pro",
                pathname: "/storage/v1/object/public/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },
    // Required for the PostHog reverse proxy below (don't strip trailing slashes).
    skipTrailingSlashRedirect: true,
    // PostHog reverse proxy — routes analytics through our own domain so
    // ad-blockers don't silently drop events in production.
    async rewrites() {
        return [
            {
                source: "/ingest/static/:path*",
                destination: "https://us-assets.i.posthog.com/static/:path*",
            },
            {
                source: "/ingest/:path*",
                destination: "https://us.i.posthog.com/:path*",
            },
            {
                source: "/ingest/flags",
                destination: "https://us.i.posthog.com/flags",
            },
        ];
    },
    // Legacy URL redirects — the dashboard collapse moved /dashboard/{admin,
    // seeker,therapist,chat}/* to top-level /{admin,seeker,therapist,chat}/*.
    // Preserves old bookmarks, external links, and emails sent before the
    // migration. Status 308 = permanent + preserves request method.
    async redirects() {
        return [
            { source: "/dashboard/admin", destination: "/admin", permanent: true },
            { source: "/dashboard/admin/:path*", destination: "/admin/:path*", permanent: true },
            { source: "/dashboard/seeker", destination: "/seeker", permanent: true },
            { source: "/dashboard/seeker/:path*", destination: "/seeker/:path*", permanent: true },
            { source: "/dashboard/therapist", destination: "/therapist", permanent: true },
            { source: "/dashboard/therapist/:path*", destination: "/therapist/:path*", permanent: true },
            { source: "/dashboard/chat", destination: "/chat", permanent: true },
            { source: "/dashboard", destination: "/login", permanent: true },
            // Pre-OTP-merge auth URLs.
            { source: "/signup/therapist", destination: "/login?mode=signup", permanent: true },
            { source: "/signup/therapist/:path*", destination: "/login?mode=signup", permanent: true },
            { source: "/signup", destination: "/login?mode=signup", permanent: true },
            { source: "/signup/:path*", destination: "/login?mode=signup", permanent: true },
            { source: "/reset-password", destination: "/login?mode=reset", permanent: true },
            { source: "/reset-password/update", destination: "/login?mode=reset", permanent: true },
            { source: "/confirm-signup", destination: "/login", permanent: true },
            // Status pages collapsed into /status.
            { source: "/pending-approval", destination: "/status", permanent: true },
            { source: "/rejected", destination: "/status", permanent: true },
            // Misnamed legacy route.
            { source: "/lawyers", destination: "/therapists", permanent: true },
        ];
    },
};
export default nextConfig;
