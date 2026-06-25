"use client";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import { createClient } from "@/components/e7335a071b71";
// posthog is already initialized in instrumentation-client.ts. This just exposes
// the singleton to the React tree so components can use the usePostHog() hook.
export function Providers({ children }) {
    return (<PostHogProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PostHogProvider>);
}
// Ties PostHog analytics to the logged-in user. Runs app-wide because Providers
// wraps the whole tree in the root layout. identify() on sign-in, reset() on
// sign-out so anonymous and authenticated events are attributed correctly.
function PostHogIdentify() {
    useEffect(() => {
        const supabase = createClient();
        const { data: { subscription }, } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                posthog.identify(session.user.id, {
                    email: session.user.email,
                });
            }
            else if (event === "SIGNED_OUT") {
                posthog.reset();
            }
        });
        return () => subscription.unsubscribe();
    }, []);
    return null;
}
