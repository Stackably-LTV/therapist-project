'use client';
import { useState } from 'react';
import { Search, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/c2f62fb0cb5e';
import { Button } from '@/components/2795b661f080';
import { Badge } from '@/components/30348591d689';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/1712d8a01fd3';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ba221113eac7';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
export function UserTable({ users, role }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [processingUserId, setProcessingUserId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const handleStatusChangeClick = (userId, newStatus, userName) => {
        setConfirmDialog({ userId, newStatus, userName });
    };
    const handleStatusChange = async (userId, newStatus) => {
        setProcessingUserId(userId);
        try {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user status');
            }
            toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
            setConfirmDialog(null);
            router.refresh();
        }
        catch (error) {
            console.error('Status update error:', error);
            toast.error(error.message || 'Failed to update user status');
        }
        finally {
            setProcessingUserId(null);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'suspended':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (<div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
          <Input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
              {filteredUsers.length === 0 ? (<tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>) : (filteredUsers.map((user) => (<tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {user.status === 'active' && (<Button variant="ghost" size="sm" onClick={() => handleStatusChangeClick(user.id, 'suspended', user.name)} disabled={processingUserId === user.id}>
                          {processingUserId === user.id ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<>
                              <Ban className="h-4 w-4 mr-1"/>
                              Suspend
                            </>)}
                        </Button>)}
                      {user.status === 'suspended' && (<Button variant="ghost" size="sm" onClick={() => handleStatusChangeClick(user.id, 'active', user.name)} disabled={processingUserId === user.id}>
                          {processingUserId === user.id ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<>
                              <CheckCircle className="h-4 w-4 mr-1"/>
                              Activate
                            </>)}
                        </Button>)}
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 20 && (<div className="px-6 py-4 bg-gray-50 text-sm text-gray-500 text-center">
            Showing {Math.min(20, filteredUsers.length)} of {filteredUsers.length} users
          </div>)}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.newStatus === 'suspended' ? 'Suspend User' : 'Activate User'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.newStatus === 'suspended'
            ? `Are you sure you want to suspend ${confirmDialog?.userName}? They will no longer be able to access their account.`
            : `Are you sure you want to activate ${confirmDialog?.userName}? They will regain access to their account.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConfirmDialog(null)} disabled={!!processingUserId}>
              Cancel
            </Button>
            <Button type="button" onClick={() => {
            if (confirmDialog) {
                handleStatusChange(confirmDialog.userId, confirmDialog.newStatus);
            }
        }} disabled={!!processingUserId} className={confirmDialog?.newStatus === 'suspended' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}>
              {processingUserId ? (<>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  Processing...
                </>) : (confirmDialog?.newStatus === 'suspended' ? 'Suspend' : 'Activate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}
