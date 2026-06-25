import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { logAuditEvent } from '@/components/0be57ea0c568';
import { ok, fail } from '@/components/7ff049787825';
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
/** Parse raw query params into a normalised ListUsersParams shape. */
export function parseListUsersParams(searchParams) {
    return {
        roleFilter: searchParams.get('role'),
        statusFilter: searchParams.get('status'),
        search: searchParams.get('search'),
        page: Math.max(1, parseInt(searchParams.get('page') ?? String(DEFAULT_PAGE), 10)),
        perPage: Math.max(1, parseInt(searchParams.get('perPage') ?? String(DEFAULT_PER_PAGE), 10)),
    };
}
/**
 * Paginated, filterable admin user list joining user_roles with profiles and
 * resolving emails per-row via the service-role admin API.
 */
export async function listUsers(params) {
    const { roleFilter, statusFilter, search, page, perPage } = params;
    const supabase = await createClient();
    // Get total count
    let countQuery = supabase.from('user_roles').select('id', { count: 'exact', head: true });
    if (roleFilter)
        countQuery = countQuery.eq('role', roleFilter);
    if (statusFilter)
        countQuery = countQuery.eq('status', statusFilter);
    if (search) {
        // server-side filter on full_name via the joined profile relation
        countQuery = countQuery.ilike('user_profiles.full_name', `%${search}%`);
    }
    const { count: totalCount } = await countQuery;
    // Join user_roles with user_profiles for full_name
    let query = supabase
        .from('user_roles')
        .select(`
      id,
      role,
      status,
      created_at,
      updated_at,
      profile:user_profiles!user_profiles_user_id_fkey(full_name)
    `)
        .order('created_at', { ascending: false });
    if (roleFilter)
        query = query.eq('role', roleFilter);
    if (statusFilter)
        query = query.eq('status', statusFilter);
    if (search)
        query = query.ilike('user_profiles.full_name', `%${search}%`);
    const fromIdx = (page - 1) * perPage;
    const toIdx = fromIdx + perPage - 1;
    query = query.range(fromIdx, toIdx);
    const { data: rows, error } = await query;
    if (error) {
        console.error('User search error:', error);
        return fail(500, 'Failed to fetch users');
    }
    // Fetch emails via service-role admin API per-id. listUsers() paginates over the
    // full auth.users table, which doesn't align with the filtered/paginated user_roles
    // result above. getUserById on the exact rows we returned is the correct join.
    const serviceClient = createServiceRoleClient();
    const emailById = new Map();
    await Promise.all((rows ?? []).map(async (r) => {
        try {
            const { data } = await serviceClient.auth.admin.getUserById(r.id);
            if (data?.user?.email)
                emailById.set(data.user.id, data.user.email);
        }
        catch {
            /* ignore — leave email blank */
        }
    }));
    let users = (rows ?? []).map((r) => {
        const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
        return {
            id: r.id,
            role: r.role,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            name: profile?.full_name ?? '',
            email: emailById.get(r.id) ?? '',
        };
    });
    // If searching, also include rows whose email matches (name was already filtered in SQL).
    // We can't email-filter in SQL since auth.users is not joinable from public.user_roles.
    if (search) {
        const q = search.toLowerCase();
        users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    const totalPages = Math.ceil((totalCount ?? 0) / perPage);
    return ok({ users, page, perPage, totalCount, totalPages });
}
const VALID_STATUSES = ['pending', 'active', 'suspended', 'rejected'];
/**
 * Change an admin-managed user's status. 'rejected' deletes the user_roles row;
 * other statuses update it (and manage suspension_reason). Audits every change.
 */
export async function updateUserStatus(adminUserId, userId, status, reason, meta) {
    if (!status || !VALID_STATUSES.includes(status)) {
        return fail(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (userId === adminUserId) {
        return fail(400, 'Cannot change your own status');
    }
    const supabase = await createClient();
    // Fetch old status for audit log
    const { data: oldUserData } = await supabase
        .from('user_roles')
        .select('status')
        .eq('id', userId)
        .single();
    // 'rejected' is a delete sentinel — drop the user_roles row so the user is bounced
    // back to /login?mode=signup& on next login. auth.users + user_profiles stay intact.
    if (status === 'rejected') {
        const { error: deleteError } = await supabase
            .from('user_roles')
            .delete()
            .eq('id', userId);
        if (deleteError) {
            console.error('User reject (delete) error:', deleteError);
            return fail(500, 'Failed to reject user');
        }
        await logAuditEvent({
            userId: adminUserId,
            action: 'user.status_change',
            tableName: 'user_roles',
            recordId: userId,
            oldData: { status: oldUserData?.status },
            newData: { deleted: true, ...(reason && { rejection_reason: reason }) },
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
        });
        return ok({ deleted: true });
    }
    // Prepare update data (status is one of pending/active/suspended at this point)
    const updateData = { status };
    // Handle suspension reason
    if (status === 'suspended' && reason) {
        updateData.suspension_reason = reason;
    }
    // Clear suspension reason when transitioning away from suspended
    if (status !== 'suspended' && oldUserData?.status === 'suspended') {
        updateData.suspension_reason = null;
    }
    const { data: updatedUser, error } = await supabase
        .from('user_roles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .maybeSingle();
    if (error || !updatedUser) {
        console.error('User status update error:', error);
        return fail(500, 'Failed to update user status');
    }
    // Log audit event with old and new status
    await logAuditEvent({
        userId: adminUserId,
        action: `user.status_change`,
        tableName: 'user_roles',
        recordId: userId,
        oldData: { status: oldUserData?.status },
        newData: { status, ...(reason && { suspension_reason: reason }) },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
    });
    return ok({ user: updatedUser });
}
