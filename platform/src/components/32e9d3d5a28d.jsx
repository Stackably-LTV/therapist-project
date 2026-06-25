'use client';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { Sparkles } from 'lucide-react';
export default function OnboardingBanner() {
    return (<Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
      <Sparkles className="h-5 w-5 text-blue-600"/>
      <AlertDescription className="ml-2">
        <span className="font-semibold text-blue-900">Welcome!</span>
        <span className="text-blue-700">
          {' '}Please complete all required fields below. Your profile will be reviewed by our admin team before approval.
        </span>
      </AlertDescription>
    </Alert>);
}
