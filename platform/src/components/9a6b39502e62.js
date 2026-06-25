import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export async function getUser() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    return user;
}
export async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: {
            get(name) {
                return cookieStore.get(name)?.value;
            },
            set(name, value, options) {
                try {
                    cookieStore.set(name, value, options);
                }
                catch (error) {
                    // The `set` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing user sessions.
                }
            },
            remove(name, options) {
                try {
                    cookieStore.set(name, '', options);
                }
                catch (error) {
                    // The `delete` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing user sessions.
                }
            },
        },
    });
}
let serviceRoleClientSingleton = null;
export function createServiceRoleClient() {
    if (serviceRoleClientSingleton)
        return serviceRoleClientSingleton;
    serviceRoleClientSingleton = createSupabaseJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return serviceRoleClientSingleton;
}
