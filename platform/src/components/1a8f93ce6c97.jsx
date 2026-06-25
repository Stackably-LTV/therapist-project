import { redirect } from 'next/navigation';
import { Clock, CheckCircle2, AlertOctagon, Ban } from 'lucide-react';
import { createClient } from '@/components/9a6b39502e62';
import { Button } from '@/components/2795b661f080';
import AuthLayout from '@/components/df16290c7838';
async function handleSignOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
}
export default async function StatusPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, status, rejection_reason, created_at')
        .eq('id', user.id)
        .maybeSingle();
    // No role → still picking. Send back to /login.
    if (!roleRow) {
        redirect('/login');
    }
    const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('full_name, onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();
    const onboardingCompleted = profileRow?.onboarding_completed ?? false;
    // Active → route to the correct dashboard. Server-side redirect, no flicker.
    if (roleRow.status === 'active') {
        if (roleRow.role === 'admin')
            redirect('/admin');
        if (roleRow.role === 'therapist')
            redirect('/therapist');
        redirect('/seeker');
    }
    // Still mid-onboarding → finish on /login.
    if (!onboardingCompleted) {
        redirect('/login');
    }
    const fullName = profileRow?.full_name ?? '';
    const submittedAt = roleRow.created_at
        ? new Date(roleRow.created_at).toLocaleDateString()
        : '';
    if (roleRow.status === 'rejected') {
        return (<AuthLayout>
        <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6 text-red-600"/>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Application not approved</h1>
            <p className="text-sm text-gray-600">
              We weren&apos;t able to approve your therapist application at this time.
            </p>
          </div>

          {roleRow.rejection_reason && (<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-900">Reason</p>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">
                {roleRow.rejection_reason}
              </p>
            </div>)}

          <div className="space-y-3 text-sm text-gray-600">
            <p>
              If you believe this is an error or would like more information, please contact
              support.
            </p>
            <p>You can reapply later by signing up again.</p>
          </div>

          <form action={handleSignOut}>
            <Button type="submit" variant="outline" className="w-full h-11 font-semibold">
              Sign Out
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Need help?{' '}
            <a href="mailto:support@psychlink.pro" className="text-primary hover:underline">
              support@psychlink.pro
            </a>
          </p>
        </div>
      </AuthLayout>);
    }
    if (roleRow.status === 'suspended') {
        return (<AuthLayout>
        <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6 text-amber-600"/>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Account suspended</h1>
            <p className="text-sm text-gray-600">
              Your account access has been paused. Reach out to support for next steps.
            </p>
          </div>

          <form action={handleSignOut}>
            <Button type="submit" variant="outline" className="w-full h-11 font-semibold">
              Sign Out
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Need help?{' '}
            <a href="mailto:support@psychlink.pro" className="text-primary hover:underline">
              support@psychlink.pro
            </a>
          </p>
        </div>
      </AuthLayout>);
    }
    // status === 'pending' — therapist awaiting admin approval.
    return (<AuthLayout>
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-gray-700"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending approval</h1>
          <p className="text-sm text-gray-600">
            Thanks
            {fullName ? (<>
                , <span className="font-semibold text-gray-900">{fullName}</span>
              </>) : null}
            . Your application is under review.
          </p>
        </div>

        <div className="mt-6 border border-gray-200 rounded-lg p-4">
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-600 mt-0.5"/>
              <span>We review credentials and onboarding details.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-600 mt-0.5"/>
              <span>Typical review time is 1–2 business days.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-600 mt-0.5"/>
              <span>You&rsquo;ll get an email when you&rsquo;re approved.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Pending review
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Email</span>
            <span className="text-gray-900 font-medium truncate max-w-[240px] sm:max-w-[320px]">
              {user.email}
            </span>
          </div>
          {submittedAt && (<div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Submitted</span>
              <span className="text-gray-900 font-medium">{submittedAt}</span>
            </div>)}
        </div>

        <div className="mt-6">
          <form action={handleSignOut}>
            <Button type="submit" variant="outline" className="w-full h-11 text-sm font-semibold">
              Sign Out
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-500">
            Need help?{' '}
            <a href="mailto:support@psychlink.pro" className="text-primary hover:underline">
              support@psychlink.pro
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>);
}
