import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '@/components/fb010e1125d7';
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
export default async function UsersPage({ searchParams }) {
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
    // Parse pagination params
    const page = Math.max(1, parseInt(searchParams.page ?? String(DEFAULT_PAGE), 10));
    const perPage = Math.max(1, parseInt(searchParams.perPage ?? String(DEFAULT_PER_PAGE), 10));
    // Get total count of all users
    const { count: totalCount } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true });
    const totalPages = Math.ceil((totalCount ?? 0) / perPage);
    // Get paginated user roles
    const fromIdx = (page - 1) * perPage;
    const toIdx = fromIdx + perPage - 1;
    const { data: roleRows } = await supabase
        .from('user_roles')
        .select('id, role, status, created_at')
        .order('created_at', { ascending: false })
        .range(fromIdx, toIdx);
    const userIds = (roleRows ?? []).map((r) => r.id);
    const { data: profileRows } = userIds.length
        ? await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .in('user_id', userIds)
        : { data: [] };
    const profileById = new Map();
    profileRows?.forEach((p) => profileById.set(p.user_id, { full_name: p.full_name }));
    // Fetch emails via service-role admin API
    const serviceClient = createServiceRoleClient();
    const emailById = new Map();
    try {
        const { data: authList } = await serviceClient.auth.admin.listUsers({ page, perPage });
        for (const u of authList?.users ?? []) {
            if (u.email)
                emailById.set(u.id, u.email);
        }
    }
    catch (e) {
        console.error('[UsersPage] listUsers error', e);
    }
    const allUsers = (roleRows ?? []).map((r) => ({
        id: r.id,
        role: r.role,
        status: r.status,
        created_at: r.created_at,
        name: profileById.get(r.id)?.full_name ?? '',
        email: emailById.get(r.id) ?? '',
    }));
    // Group by role
    const therapists = allUsers?.filter((u) => u.role === 'therapist') || [];
    const clients = allUsers?.filter((u) => u.role === 'seeker') || [];
    const admins = allUsers?.filter((u) => u.role === 'admin') || [];
    const activeTherapists = therapists.filter((t) => t.status === 'active');
    const pendingTherapists = therapists.filter((t) => t.status === 'pending');
    return (<div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">View and manage all platform users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalCount || 0}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Therapists</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{activeTherapists.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {pendingTherapists.length} pending
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Clients</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{clients.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Administrators</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{admins.length}</p>
        </div>
      </div>

      {/* User Tables */}
      <div className="space-y-6">
        {/* Therapists */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Therapists ({therapists.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {therapists.length === 0 ? (<tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No therapists yet
                    </td>
                  </tr>) : (therapists.map((therapist) => (<tr key={therapist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{therapist.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{therapist.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${therapist.status === 'active'
                ? 'bg-green-100 text-green-800'
                : therapist.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'}`}>
                          {therapist.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(therapist.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/admin/users/${therapist.id}`} className="text-indigo-600 hover:text-indigo-900">
                          View
                        </Link>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Clients ({totalCount ?? 0})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.length === 0 ? (<tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No users on this page
                    </td>
                  </tr>) : (allUsers.map((user) => (<tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-900">
                          View
                        </Link>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (<Pagination currentPage={page} totalPages={totalPages} baseUrl="/admin/users"/>)}
        </div>
      </div>
    </div>);
}
