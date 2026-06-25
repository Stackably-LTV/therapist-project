'use client';
import { useTransition } from 'react';
import { CheckCircle2, UserRound } from 'lucide-react';
import { chooseSignupRole } from '@/components/8e1434545edd';
import { Button } from '@/components/2795b661f080';
const OPTIONS = [
    {
        role: 'seeker',
        title: "I'm seeking therapy",
        description: 'Find qualified therapists, book sessions, and track your mental health journey',
        accent: 'hover:border-blue-500',
    },
    {
        role: 'therapist',
        title: "I'm a therapist",
        description: 'Join our platform, manage clients, and grow your practice with powerful tools',
        accent: 'hover:border-indigo-500',
    },
];
export default function SignupRoleSelection() {
    const [pending, startTransition] = useTransition();
    const handleSelect = (role) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('role', role);
            const params = new URLSearchParams(window.location.search);
            const redirectTo = params.get('redirect') || '';
            if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
                formData.append('redirect', redirectTo);
            }
            await chooseSignupRole(formData);
        });
    };
    return (<div className="space-y-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-2">
          Step 2 · Choose your experience
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          How do you plan to use the platform?
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your email is verified. Select the path that best describes you to finish setting up your
          account.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {OPTIONS.map((option) => (<div key={option.role} role="button" tabIndex={0} onClick={() => handleSelect(option.role)} onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(option.role);
                }
            }} className="text-center bg-white border border-gray-200 rounded-lg p-8 hover:border-primary transition-all cursor-pointer">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UserRound className="w-8 h-8 text-gray-700"/>
            </div>
            {pending && (<div className="flex justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500"/>
              </div>)}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h2>
            <p className="text-gray-600 mb-6 text-sm">{option.description}</p>
            <Button variant={option.role === 'seeker' ? 'default' : 'outline'} className="w-full pointer-events-none" disabled={pending}>
              {pending ? 'Preparing your dashboard...' : `Continue as ${option.role}`}
            </Button>
          </div>))}
      </div>
    </div>);
}
