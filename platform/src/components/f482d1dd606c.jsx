'use client';
import { useState } from 'react';
import LoginForm from '@/components/71dda4ab45b6';
import SignupInitialForm from '@/components/c2d0a7f79d4e';
import SignupVerifyForm from '@/components/49139164b715';
import PasswordResetRequestForm from '@/components/978c1b61cc42';
import PasswordResetVerifyForm from '@/components/f10f7c48ee53';
const HEADINGS = {
    login: {
        title: 'Welcome Back',
        subtitle: 'Sign in to continue your journey',
    },
    signup: {
        title: 'Create your account',
        subtitle: 'Start your journey with Psychlink',
    },
    'signup-verify': {
        title: 'Verify your email',
        subtitle: 'Enter the 6-digit code we just sent you',
    },
    'reset-request': {
        title: 'Reset Password',
        subtitle: "Enter your email and we'll send you a 6-digit code",
    },
    'reset-verify': {
        title: 'Set a new password',
        subtitle: 'Enter the code from your email and choose a new password',
    },
};
export default function AuthShell({ initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode);
    const [signupEmail, setSignupEmail] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const heading = HEADINGS[mode];
    return (<>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{heading.title}</h1>
        <p className="text-gray-600">{heading.subtitle}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8">
        {mode === 'login' && <LoginForm />}
        {mode === 'signup' && (<SignupInitialForm onSent={(email) => {
                setSignupEmail(email);
                setMode('signup-verify');
            }}/>)}
        {mode === 'signup-verify' && (<SignupVerifyForm email={signupEmail} onBack={() => setMode('signup')}/>)}
        {mode === 'reset-request' && (<PasswordResetRequestForm initialEmail={resetEmail} onSent={(email) => {
                setResetEmail(email);
                setMode('reset-verify');
            }}/>)}
        {mode === 'reset-verify' && (<PasswordResetVerifyForm email={resetEmail} onBack={() => setMode('reset-request')}/>)}

        <div className="mt-6 space-y-3 text-center">
          {mode === 'login' && (<>
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">
                  Sign up
                </button>
              </p>
              <p className="text-sm text-gray-600">
                <button type="button" onClick={() => setMode('reset-request')} className="text-primary hover:underline">
                  Forgot your password?
                </button>
              </p>
            </>)}
          {mode === 'signup' && (<p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </p>)}
          {(mode === 'signup-verify' ||
            mode === 'reset-request' ||
            mode === 'reset-verify') && (<p className="text-sm text-gray-600">
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">
                Back to sign in
              </button>
            </p>)}
        </div>
      </div>
    </>);
}
