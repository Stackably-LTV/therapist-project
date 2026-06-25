import { createClient } from "@/components/e7335a071b71";
export class AuthService {
    supabase = createClient();
    /**
     * Sign up a new user
     * Uses database trigger (handle_new_user) to automatically create user profile
     * This is the official Supabase pattern - see https://supabase.com/docs/guides/auth/managing-user-data#using-triggers
     */
    async signUp(data) {
        try {
            // OTP-based email confirmation — Supabase email template sends a
            // 6-digit code via {{ .Token }}. No magic-link redirect needed.
            const { data: authData, error: authError } = await this.supabase.auth
                .signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        role: data.role,
                        profileData: data.profileData || {},
                    },
                },
            });
            if (authError)
                throw authError;
            if (!authData.user)
                throw new Error("User creation failed");
            // Profile is automatically created by the database trigger
            return { user: authData.user, session: authData.session };
        }
        catch (error) {
            console.error("Signup error:", error);
            throw error;
        }
    }
    /**
     * Sign in an existing user
     */
    async signIn(data) {
        try {
            const { data: authData, error } = await this.supabase.auth
                .signInWithPassword({
                email: data.email,
                password: data.password,
            });
            if (error)
                throw error;
            return { user: authData.user, session: authData.session };
        }
        catch (error) {
            console.error("Sign in error:", error);
            throw error;
        }
    }
    /**
     * Sign out the current user
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error)
                throw error;
        }
        catch (error) {
            console.error("Sign out error:", error);
            throw error;
        }
    }
    /**
     * Get the current user
     */
    async getCurrentUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            return user;
        }
        catch (error) {
            console.error("Get current user error:", error);
            return null;
        }
    }
    /**
     * Get the current user's role
     */
    async getUserRole() {
        try {
            const user = await this.getCurrentUser();
            if (!user)
                return null;
            const { data, error } = await this.supabase
                .from("user_roles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();
            if (error)
                throw error;
            return data?.role ?? null;
        }
        catch (error) {
            console.error("Get user role error:", error);
            return null;
        }
    }
    /**
     * Get the current user's profile
     */
    async getUserProfile() {
        try {
            const user = await this.getCurrentUser();
            if (!user)
                return null;
            // Read role + profile separately since `users` is split into
            // `user_roles` (id/role/status) and `user_profiles` (display fields).
            const [{ data: roleRow, error: roleError }, { data: profileRow, error: profileError }] = await Promise.all([
                this.supabase
                    .from("user_roles")
                    .select("id, role, status, created_at, updated_at")
                    .eq("id", user.id)
                    .maybeSingle(),
                this.supabase
                    .from("user_profiles")
                    .select("*")
                    .eq("user_id", user.id)
                    .maybeSingle(),
            ]);
            if (roleError)
                throw roleError;
            if (profileError)
                throw profileError;
            if (!roleRow)
                return null;
            return { ...roleRow, profile: profileRow ?? null };
        }
        catch (error) {
            console.error("Get user profile error:", error);
            return null;
        }
    }
    /**
     * Request password reset
     */
    async resetPassword(email) {
        try {
            // OTP-based recovery — no redirect needed; user finishes on /login.
            const { error } = await this.supabase.auth.resetPasswordForEmail(email);
            if (error)
                throw error;
        }
        catch (error) {
            console.error("Password reset error:", error);
            throw error;
        }
    }
    /**
     * Update password
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword,
            });
            if (error)
                throw error;
        }
        catch (error) {
            console.error("Update password error:", error);
            throw error;
        }
    }
    /**
     * Resend verification email
     */
    async resendVerificationEmail(email) {
        try {
            // OTP-based — Supabase resends the 6-digit code via {{ .Token }}.
            const { error } = await this.supabase.auth.resend({
                type: "signup",
                email,
            });
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            console.error("Resend verification email error:", error);
            throw error;
        }
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        try {
            const { data, error } = await this.supabase
                .from("user_profiles")
                .update(updates)
                .eq("user_id", userId)
                .select("user_id")
                .single();
            if (error) {
                const details = [error.message, error.details, error.hint]
                    .filter(Boolean)
                    .join(" | ");
                throw new Error(`Failed to update profile: ${details}`);
            }
            if (!data?.user_id) {
                throw new Error("Failed to update profile: profile record was not found.");
            }
        }
        catch (error) {
            console.error("Update profile error:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Failed to update profile.");
        }
    }
}
// Export singleton instance
export const authService = new AuthService();
