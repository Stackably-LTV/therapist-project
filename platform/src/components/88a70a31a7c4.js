import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
export async function proxy(request) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
        },
    });
    const { data: { user }, } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    // Public routes that don't require auth
    const publicRoutes = [
        "/",
        "/login",
        "/status",
        "/about",
        "/contact",
        "/for-seekers",
        "/marketplace",
        "/pricing",
        "/privacy",
        "/terms",
        "/therapists",
        "/courses",
        "/api/auth/callback",
        "/api/courses",
        "/api/payments/webhook",
    ];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
    // Always let API routes pass through — they do their own auth
    if (pathname.startsWith("/api/")) {
        return response;
    }
    // Unauthenticated → bounce to /login (preserving intended destination)
    if (!user && !isPublicRoute) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
    }
    if (!user) {
        return response;
    }
    // OTP-based signup verifies email at the same time as creating the session,
    // so any authenticated user here has a confirmed email. Skip the legacy
    // "wait for verification" gate.
    // Fetch role + status from user_roles
    const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();
    // No user_roles row → user must pick a role at /login (role picker)
    if (!roleRow) {
        if (pathname === "/login") {
            return response;
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }
    const role = roleRow.role;
    const status = roleRow.status;
    // Rejected + suspended users land on /status (server-renders the right
    // view based on user_roles.status — no client-side flicker).
    if (status === "rejected" || status === "suspended") {
        if (pathname !== "/status" && !pathname.startsWith("/api/auth/signout")) {
            return NextResponse.redirect(new URL("/status", request.url));
        }
        return response;
    }
    // Fetch profile (onboarding + therapist-specific completeness fields)
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed, license_number, licensed_states, specialties, rate")
        .eq("user_id", user.id)
        .maybeSingle();
    const onboardingCompleted = profile?.onboarding_completed === true;
    // Compute the canonical post-auth destination for this user
    const computePostAuthRedirect = () => {
        if (role === "admin")
            return "/admin";
        if (role === "therapist") {
            const hasLicense = !!profile?.license_number;
            const licensedStates = Array.isArray(profile?.licensed_states)
                ? profile.licensed_states.filter((v) => typeof v === "string" && v.trim().length > 0)
                : [];
            const hasState = licensedStates.length > 0;
            const hasSpecialties = Array.isArray(profile?.specialties) &&
                profile.specialties.length > 0;
            const hasRate = profile?.rate != null;
            const isProfileComplete = hasLicense && hasState && hasSpecialties && hasRate;
            if (!onboardingCompleted || !isProfileComplete) {
                return "/login";
            }
            if (status === "pending")
                return "/status";
            return "/therapist";
        }
        // seeker
        if (!onboardingCompleted)
            return "/login";
        return "/seeker";
    };
    // Redirect logged-in users away from /login if they're past the onboarding flow
    if (pathname === "/login") {
        const target = computePostAuthRedirect();
        if (target !== "/login") {
            return NextResponse.redirect(new URL(target, request.url));
        }
        return response;
    }
    // ---------- ADMIN ----------
    if (role === "admin") {
        // Legacy: admin links into therapist profile pages → admin equivalent
        if (pathname.startsWith("/therapist/profile/")) {
            const therapistId = pathname.slice("/therapist/profile/".length).split("/")[0] ||
                "";
            return NextResponse.redirect(new URL(therapistId
                ? `/admin/therapists/${therapistId}`
                : "/admin", request.url));
        }
        if (pathname.startsWith("/login") &&
            !pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
        return response;
    }
    // ---------- THERAPIST ----------
    if (role === "therapist") {
        const hasLicense = !!profile?.license_number;
        const licensedStates = Array.isArray(profile?.licensed_states)
            ? profile.licensed_states.filter((v) => typeof v === "string" && v.trim().length > 0)
            : [];
        const hasState = licensedStates.length > 0;
        const hasSpecialties = Array.isArray(profile?.specialties) &&
            profile.specialties.length > 0;
        const hasRate = profile?.rate != null;
        const isProfileComplete = hasLicense && hasState && hasSpecialties && hasRate;
        // Step 1: onboarding incomplete (no profile row OR missing required fields)
        if (!profile || !onboardingCompleted || !isProfileComplete) {
            if (pathname !== "/login") {
                return NextResponse.redirect(new URL("/login", request.url));
            }
            return response;
        }
        // Step 2: onboarding done but awaiting admin approval
        if (status === "pending") {
            if (pathname !== "/status" && pathname !== "/login") {
                return NextResponse.redirect(new URL("/status", request.url));
            }
            return response;
        }
        // Step 3: active — restrict to therapist + shared chat surfaces
        if (status === "active") {
            if (pathname.startsWith("/login") &&
                !pathname.startsWith("/therapist") &&
                !pathname.startsWith("/chat")) {
                return NextResponse.redirect(new URL("/therapist", request.url));
            }
        }
        return response;
    }
    // ---------- SEEKER ----------
    if (role === "seeker") {
        if (!onboardingCompleted) {
            if (pathname !== "/login") {
                return NextResponse.redirect(new URL("/login", request.url));
            }
            return response;
        }
        if (pathname.startsWith("/login") &&
            !pathname.startsWith("/seeker") &&
            !pathname.startsWith("/chat")) {
            return NextResponse.redirect(new URL("/seeker", request.url));
        }
    }
    return response;
}
