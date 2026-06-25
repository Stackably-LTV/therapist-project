'use client';
import { useMemo, useState, useTransition } from 'react';
import { performTherapistAction } from '@/components/46c673fad061';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Badge } from '@/components/30348591d689';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ba221113eac7';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Separator } from '@/components/19cc3f2900f4';
import { CheckCircle2, Clock, Filter, Trash2, Undo2, UserCheck, XCircle, } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/components/98e56006aa84';
import { US_STATES } from '@/components/96fabadae962';
const STATUS_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Terminated', value: 'terminated' },
];
const ACTION_NEEDS_REASON = new Set(['reject', 'terminate']);
export default function TherapistManagementTable({ therapists, logs }) {
    const [statusFilter, setStatusFilter] = useState('pending');
    const [search, setSearch] = useState('');
    const [selectedAction, setSelectedAction] = useState(null);
    const [reason, setReason] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [isPending, startTransition] = useTransition();
    const therapistsById = useMemo(() => {
        const map = new Map();
        therapists.forEach((t) => map.set(t.id, t));
        return map;
    }, [therapists]);
    const logsByTherapist = useMemo(() => {
        const map = new Map();
        logs.forEach((log) => {
            if (!map.has(log.therapist_id)) {
                map.set(log.therapist_id, []);
            }
            map.get(log.therapist_id).push(log);
        });
        return map;
    }, [logs]);
    const filteredTherapists = useMemo(() => {
        return therapists.filter((therapist) => {
            const profile = therapist.profile_json || {};
            const matchesStatus = statusFilter === 'all'
                ? true
                : statusFilter === 'terminated'
                    ? therapist.status === 'terminated' || therapist.status === 'suspended'
                    : therapist.status === statusFilter;
            if (!matchesStatus)
                return false;
            if (!search.trim())
                return true;
            const query = search.trim().toLowerCase();
            const stateCode = profile.state || '';
            const stateName = US_STATES.find((s) => s.value === stateCode)?.label || '';
            return (therapist.name.toLowerCase().includes(query) ||
                therapist.email.toLowerCase().includes(query) ||
                stateCode.toLowerCase().includes(query) ||
                stateName.toLowerCase().includes(query));
        });
    }, [therapists, statusFilter, search]);
    const handleActionClick = (therapistId, therapistName, action) => {
        setFeedback(null);
        setSelectedAction({ therapistId, therapistName, action });
        setReason('');
    };
    const submitAction = () => {
        if (!selectedAction)
            return;
        // Validation for actions that require a reason
        if (['reject', 'terminate'].includes(selectedAction.action) && reason.trim().length < 8) {
            return;
        }
        startTransition(async () => {
            const result = await performTherapistAction({
                therapistId: selectedAction.therapistId,
                action: selectedAction.action,
                reason: reason.trim() || undefined,
            });
            if (!result.success) {
                setFeedback(result.error || 'Action failed. Please try again.');
            }
            else {
                setFeedback(`Successfully ${selectedAction.action}d ${selectedAction.therapistName}.`);
                setSelectedAction(null);
                setReason('');
            }
        });
    };
    const getActionConfig = (action) => {
        switch (action) {
            case 'approve':
                return {
                    title: 'Approve Therapist',
                    description: 'This will activate the therapist account and send a welcome email.',
                    placeholder: 'Optional: Add a welcome message or specific notes...',
                    buttonText: 'Approve & Send Email',
                    buttonColor: 'bg-green-600 hover:bg-green-700',
                    requiresReason: false,
                };
            case 'reject':
                return {
                    title: 'Reject Application',
                    description: 'This will reject the application and notify the therapist.',
                    placeholder: 'Required: Explain why the application was rejected...',
                    buttonText: 'Reject & Notify',
                    buttonColor: 'bg-red-600 hover:bg-red-700',
                    requiresReason: true,
                };
            case 'terminate':
                return {
                    title: 'Terminate Access',
                    description: 'This will immediately revoke access and notify the therapist.',
                    placeholder: 'Required: Explain the reason for termination...',
                    buttonText: 'Terminate Access',
                    buttonColor: 'bg-red-600 hover:bg-red-700',
                    requiresReason: true,
                };
            case 'reinstate':
                return {
                    title: 'Reinstate Account',
                    description: 'This will restore access for this therapist.',
                    placeholder: 'Optional: Add a note about reinstatement...',
                    buttonText: 'Reinstate Account',
                    buttonColor: 'bg-blue-600 hover:bg-blue-700',
                    requiresReason: false,
                };
            default:
                return {
                    title: 'Confirm Action',
                    description: 'Are you sure you want to proceed?',
                    placeholder: 'Add a note...',
                    buttonText: 'Confirm',
                    buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
                    requiresReason: false,
                };
        }
    };
    return (<>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black text-gray-900">Review Queue</CardTitle>
              <p className="text-gray-500 mt-1">
                Manage therapist applications and active accounts.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                 </svg>
              </div>
              <Input placeholder="Search by name, email, or state..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white border-gray-200 focus:ring-indigo-500 rounded-xl w-full transition-all focus:w-full"/>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-full overflow-x-auto">
            <div className="pl-2 pr-1 text-gray-400">
              <Filter className="w-4 h-4"/>
            </div>
            <div className="flex flex-wrap gap-1 min-w-max">
              {STATUS_FILTERS.map((filter) => (<Button key={filter.value} type="button" variant={filter.value === statusFilter ? 'default' : 'ghost'} size="sm" className={cn('rounded-xl text-xs font-semibold px-4 transition-all h-9', filter.value === statusFilter
                ? 'bg-gray-900 text-white shadow-md hover:bg-black'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')} onClick={() => setStatusFilter(filter.value)} disabled={isPending}>
                  {filter.label}
                </Button>))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          {feedback && (<div className={`rounded-xl border px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${feedback.includes('failed')
                ? 'border-red-100 bg-red-50 text-red-800'
                : 'border-green-100 bg-green-50 text-green-800'}`}>
              {feedback}
            </div>)}

          {filteredTherapists.length === 0 ? (<div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 rounded-3xl border border-dashed border-gray-200">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4 ring-1 ring-gray-100">
                <UserCheck className="w-8 h-8 text-gray-300"/>
              </div>
              <h3 className="text-lg font-bold text-gray-900">No therapists found</h3>
              <p className="text-gray-500 max-w-sm mt-1 text-sm">
                We couldn't find any therapists matching your current filters.
              </p>
            </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTherapists.map((therapist) => {
                const profile = therapist.profile_json || {};
                const stateCode = profile.state || '';
                const specialties = profile.specialties || [];
                const createdAgo = formatDistanceToNow(new Date(therapist.created_at), { addSuffix: true });
                const therapistLogs = logsByTherapist.get(therapist.id) || [];
                const latestLog = therapistLogs[0];
                const profileImage = profile.profile_image_url ||
                    profile.profile_image ||
                    profile.image_url ||
                    null;
                return (<div key={therapist.id} id={`therapist-${therapist.id}`} className="group relative flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100/50 transition-all duration-300 overflow-hidden">
                    {/* Top Accent Gradient */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                    <div className="p-6 flex-1 flex flex-col">
                      {/* Header Section */}
                      <div className="flex items-start justify-between gap-4 mb-5">
                          <div className="flex items-center gap-3">
                             <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border-2 border-white shadow-md ring-1 ring-black/5 overflow-hidden">
                                {profileImage ? (<img src={profileImage} alt={therapist.name} className="h-full w-full object-cover"/>) : (<span className="text-lg font-bold text-indigo-600">
                                      {therapist.name.charAt(0).toUpperCase()}
                                   </span>)}
                             </div>
                             <div>
                                <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                  {therapist.name}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">{therapist.email}</p>
                             </div>
                          </div>
                          
                          <Badge variant="secondary" className={cn("capitalize font-semibold border-none px-2.5 py-1 rounded-lg", therapist.status === 'active' ? "bg-green-100 text-green-700" :
                        therapist.status === 'pending' ? "bg-amber-100 text-amber-700" :
                            (therapist.status === 'suspended' || therapist.status === 'terminated') ? "bg-red-100 text-red-700" :
                                therapist.status === 'rejected' ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-600")}>
                            {therapist.status === 'suspended' ? 'terminated' : therapist.status}
                          </Badge>
                      </div>

                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-5">
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100/50">
                             <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Rate</div>
                             <div className="text-sm font-bold text-gray-900">
                               ${Number(profile.rate) || 0}
                             </div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100/50">
                             <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Exp</div>
                             <div className="text-sm font-bold text-gray-900">
                               {Number(profile.years_experience) || 0}y
                             </div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100/50">
                             <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">State</div>
                             <div className="text-sm font-bold text-gray-900">
                               {stateCode || 'N/A'}
                             </div>
                          </div>
                      </div>

                      <Separator className="bg-gray-100 mb-4"/>

                      {/* Specialties */}
                      <div className="flex-1 space-y-2 mb-4">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Specialties</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5 h-[52px] content-start overflow-hidden">
                            {specialties.length > 0 ? (specialties.slice(0, 4).map((s, i) => (<span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-white border border-gray-200 text-gray-600 shadow-sm">
                                  {s}
                                </span>))) : (<span className="text-sm text-gray-400 italic">No specialties listed</span>)}
                            {specialties.length > 4 && (<span className="text-[10px] font-medium text-gray-400 self-center pl-1">
                                +{specialties.length - 4} more
                              </span>)}
                         </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 mt-auto">
                        <div className="flex flex-col gap-2">
                            <Button asChild variant="outline" className="w-full justify-center h-9 font-medium border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                              <Link href={`/admin/users/${therapist.id}`}>
                                <UserCheck className="w-3.5 h-3.5 mr-2 text-gray-400"/>
                                View Full Profile
                              </Link>
                            </Button>

                            {therapist.status === 'pending' && (<div className="grid grid-cols-2 gap-2">
                                <Button className="h-9 bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-200" onClick={() => handleActionClick(therapist.id, therapist.name, 'approve')} disabled={isPending}>
                                  Approve
                                </Button>
                                <Button variant="outline" className="h-9 text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200" onClick={() => handleActionClick(therapist.id, therapist.name, 'reject')} disabled={isPending}>
                                  Reject
                                </Button>
                              </div>)}

                            {therapist.status === 'active' && (<Button variant="ghost" className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700 justify-start px-0" onClick={() => handleActionClick(therapist.id, therapist.name, 'terminate')} disabled={isPending}>
                                <span className="flex items-center justify-center w-full">
                                    <Trash2 className="w-3.5 h-3.5 mr-2"/>
                                    Terminate Access
                                </span>
                              </Button>)}

                            {(therapist.status === 'rejected' || therapist.status === 'terminated' || therapist.status === 'suspended') && (<Button variant="secondary" className="h-9 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" onClick={() => handleActionClick(therapist.id, therapist.name, 'reinstate')} disabled={isPending}>
                                <Undo2 className="w-3.5 h-3.5 mr-2"/>
                                Reinstate Account
                              </Button>)}
                        </div>
                      </div>
                    </div>
                  </div>);
            })}
            </div>)}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAction} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedAction && (<>
                  {selectedAction.action === 'approve' && <CheckCircle2 className="w-6 h-6 text-green-600"/>}
                  {selectedAction.action === 'reject' && <XCircle className="w-6 h-6 text-red-600"/>}
                  {selectedAction.action === 'terminate' && <Trash2 className="w-6 h-6 text-red-600"/>}
                  {selectedAction.action === 'reinstate' && <Undo2 className="w-6 h-6 text-blue-600"/>}
                  {getActionConfig(selectedAction.action).title}
                </>)}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {selectedAction && getActionConfig(selectedAction.action).description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea placeholder={selectedAction ? getActionConfig(selectedAction.action).placeholder : ''} value={reason} onChange={(e) => setReason(e.target.value)} disabled={isPending} rows={5} className="resize-none text-base focus-visible:ring-indigo-500"/>
            {selectedAction && getActionConfig(selectedAction.action).requiresReason && (<p className="text-xs text-red-500 mt-2 font-medium">
                * A reason is required for this action (min 8 characters).
              </p>)}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSelectedAction(null)} disabled={isPending} className="h-11">
              Cancel
            </Button>
            <Button type="button" onClick={submitAction} disabled={isPending ||
            (selectedAction &&
                getActionConfig(selectedAction.action).requiresReason &&
                reason.trim().length < 8)} className={cn("h-11 font-semibold text-white", selectedAction ? getActionConfig(selectedAction.action).buttonColor : '')}>
              {isPending ? (<>
                  <Clock className="w-4 h-4 mr-2 animate-spin"/>
                  Processing...
                </>) : (selectedAction && getActionConfig(selectedAction.action).buttonText)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);
}
