'use client';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Label } from '@/components/78846397f3ca';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/2318256b5648';
import { Progress } from '@/components/150a7f6a46ac';
import { Badge } from '@/components/30348591d689';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { uploadProfileImage, uploadCredentials } from '@/components/fb87d6499041';
import { User, Briefcase, FileText, Upload, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Award, Loader2, AlertCircle, Calendar, Phone, Wallet, } from 'lucide-react';
import { US_STATES } from '@/components/96fabadae962';
import { THERAPIST_SPECIALTIES } from '@/components/57e166f9150d';
import AvailabilityEditor from '@/components/1f135646eb15';
import { Switch } from '@/components/395ec797588e';
import { useTherapistOnboardingStore, } from '@/components/8364bd9bfb8d';
import { UsPhoneInput } from '@/components/d8ce739ee04e';
import { normalizeUsPhoneToNationalDigits, usNationalDigitsToE164 } from '@/components/98e56006aa84';
import TherapistPlanPickerStep from '@/components/2cd87be31774';
import { saveTherapistOnboardingStep, } from '@/components/cfb0f8be39f5';
export default function TherapistSignupForm({ userEmail, userName = '', tiers, hasSubscription, isPaymentVerified, initialProfile, }) {
    const currentStep = useTherapistOnboardingStore((s) => s.currentStep);
    const formData = useTherapistOnboardingStore((s) => s.formData);
    const loading = useTherapistOnboardingStore((s) => s.loading);
    const error = useTherapistOnboardingStore((s) => s.error);
    const uploading = useTherapistOnboardingStore((s) => s.uploading);
    const stateQuery = useTherapistOnboardingStore((s) => s.stateQuery);
    const setStep = useTherapistOnboardingStore((s) => s.setStep);
    const updateFormData = useTherapistOnboardingStore((s) => s.updateFormData);
    const setError = useTherapistOnboardingStore((s) => s.setError);
    const setLoading = useTherapistOnboardingStore((s) => s.setLoading);
    const setUploading = useTherapistOnboardingStore((s) => s.setUploading);
    const setStateQuery = useTherapistOnboardingStore((s) => s.setStateQuery);
    const reset = useTherapistOnboardingStore((s) => s.reset);
    const searchParams = useSearchParams();
    // Sync defaults from server props once — only hydrate empty fields so we don't
    // clobber in-progress edits already persisted in sessionStorage.
    useEffect(() => {
        const patch = {};
        if (!formData.displayName && (initialProfile?.fullName || userName)) {
            patch.displayName = initialProfile?.fullName || userName;
        }
        if (!formData.phone && initialProfile?.phoneE164) {
            patch.phone = normalizeUsPhoneToNationalDigits(initialProfile.phoneE164);
        }
        if (!formData.profileImageUrl && initialProfile?.profileImageUrl) {
            patch.profileImageUrl = initialProfile.profileImageUrl;
        }
        if (!formData.license_number && initialProfile?.licenseNumber) {
            patch.license_number = initialProfile.licenseNumber;
        }
        if ((!formData.licensed_states || formData.licensed_states.length === 0) && initialProfile?.licensedStates?.length) {
            patch.licensed_states = initialProfile.licensedStates;
        }
        if ((!formData.specialties || formData.specialties.length === 0) && initialProfile?.specialties?.length) {
            patch.specialties = initialProfile.specialties;
        }
        if (!formData.years_experience && initialProfile?.yearsExperience != null) {
            patch.years_experience = String(initialProfile.yearsExperience);
        }
        if (!formData.rate && initialProfile?.rate != null) {
            patch.rate = String(initialProfile.rate);
        }
        if (!formData.bio && initialProfile?.bio) {
            patch.bio = initialProfile.bio;
        }
        if ((!formData.availability || formData.availability.length === 0) && initialProfile?.availability?.length) {
            patch.availability = initialProfile.availability;
        }
        if (Object.keys(patch).length > 0) {
            updateFormData(patch);
        }
        // Run once on mount; we explicitly do NOT depend on formData here to avoid
        // re-overwriting user input. Linter exception is intentional.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Step gating: URL params can REQUEST a step, but server-side payment verification has final say.
    // If the user tries to land on step 3+ without a paid/trialing subscription, force them to step 2.
    useEffect(() => {
        const stepParam = searchParams.get('step');
        const checkoutState = searchParams.get('checkout');
        const reason = searchParams.get('reason');
        let targetStep = null;
        if (stepParam) {
            const parsed = Number(stepParam);
            if (parsed >= 1 && parsed <= 6) {
                targetStep = parsed;
            }
        }
        else if (checkoutState === 'success') {
            targetStep = 3;
        }
        if (targetStep !== null) {
            // Hard gate: no step 3+ without verified payment.
            if (targetStep >= 3 && !isPaymentVerified) {
                setStep(2);
                setError('Your subscription is not active yet. Please pick a plan and complete checkout to continue.');
            }
            else {
                setStep(targetStep);
            }
        }
        if (checkoutState === 'cancelled' && reason) {
            const messages = {
                verify_failed: "We couldn't verify your subscription with Stripe. Please pick your plan again — you weren't charged.",
                missing_session: 'Checkout session not found. Please pick your plan and try again.',
                mismatched_session: 'That checkout session belongs to another account. Please pick your plan again.',
            };
            setError(messages[reason] ?? 'Checkout did not complete. Please try again.');
        }
    }, [searchParams, setStep, setError, isPaymentVerified]);
    // Continuous guard: if the store somehow holds a step 3+ value but payment is not verified,
    // snap back to step 2 every render. Catches stale sessionStorage state too.
    useEffect(() => {
        if (currentStep >= 3 && !isPaymentVerified) {
            setStep(2);
        }
        else if (isPaymentVerified && currentStep < 3 && hasSubscription) {
            // Auto-advance once payment lands.
            setStep(3);
        }
    }, [currentStep, isPaymentVerified, hasSubscription, setStep]);
    const steps = [
        { number: 1, name: 'Basic Info', icon: User },
        { number: 2, name: 'Plan & Trial', icon: Wallet },
        { number: 3, name: 'Professional', icon: Briefcase },
        { number: 4, name: 'Practice', icon: Award },
        { number: 5, name: 'Schedule', icon: Calendar },
        { number: 6, name: 'Documents', icon: FileText },
    ];
    const formProgress = useMemo(() => {
        const step1Complete = formData.displayName.length > 0 ? 1 : 0;
        const step2Complete = hasSubscription || (formData.selectedPlanCode?.length ?? 0) > 0 ? 1 : 0;
        const step3Complete = formData.license_number.length > 0 &&
            formData.years_experience.length > 0 &&
            formData.specialties.length > 0 &&
            formData.licensed_states.length > 0
            ? 1
            : 0;
        const step4Complete = formData.rate.length > 0 && formData.bio.length > 0 ? 1 : 0;
        const step5Complete = formData.availability.length > 0 ? 1 : 0;
        const step6Complete = formData.licenseDocument && formData.resumeDocument ? 1 : 0;
        return Math.round(((step1Complete + step2Complete + step3Complete + step4Complete + step5Complete + step6Complete) /
            6) *
            100);
    }, [formData, hasSubscription]);
    /**
     * Fire-and-forget partial save to Supabase for the step the user is leaving.
     * sessionStorage already persists in real-time; this just adds a server-side
     * checkpoint so progress survives device/tab loss.
     */
    const persistStepToServer = (leavingStep) => {
        let input = null;
        if (leavingStep === 1) {
            input = {
                step: 1,
                data: {
                    displayName: formData.displayName || undefined,
                    phoneDigits: formData.phone || undefined,
                    profileImageUrl: formData.profileImageUrl || undefined,
                },
            };
        }
        else if (leavingStep === 3) {
            const years = Number.parseInt(formData.years_experience, 10);
            input = {
                step: 3,
                data: {
                    licenseNumber: formData.license_number || undefined,
                    licensedStates: formData.licensed_states.length ? formData.licensed_states : undefined,
                    specialties: formData.specialties.length ? formData.specialties : undefined,
                    yearsExperience: Number.isFinite(years) && years >= 0 ? years : undefined,
                },
            };
        }
        else if (leavingStep === 4) {
            const rate = Number.parseFloat(formData.rate);
            input = {
                step: 4,
                data: {
                    rate: Number.isFinite(rate) && rate >= 0 ? rate : undefined,
                    bio: formData.bio || undefined,
                    allowSelfBooking: formData.allow_self_booking,
                    calendarVisible: formData.calendar_visible,
                },
            };
        }
        else if (leavingStep === 5) {
            input = {
                step: 5,
                data: {
                    availability: formData.availability.length ? formData.availability : undefined,
                },
            };
        }
        if (!input)
            return;
        saveTherapistOnboardingStep(input)
            .then((result) => {
            if (!result.ok) {
                console.warn('[therapist-onboarding] step save failed', leavingStep, 'error' in result ? result.error : 'unknown');
            }
        })
            .catch((err) => {
            console.warn('[therapist-onboarding] step save threw', leavingStep, err);
        });
    };
    const handleNext = () => {
        if (currentStep === 1) {
            if (!formData.displayName.trim()) {
                setError('Display name is required.');
                return;
            }
            if (formData.phone && formData.phone.length !== 10) {
                setError('Phone must be 10 digits (US).');
                return;
            }
        }
        if (currentStep === 3 && formData.licensed_states.length === 0) {
            setError('Please select at least one licensed state to continue.');
            return;
        }
        if (currentStep < 6) {
            persistStepToServer(currentStep);
            setStep((currentStep + 1));
            setError('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const handleBack = () => {
        // Don't let users go back to plan-picker once they've already paid.
        const min = hasSubscription ? 3 : 1;
        if (currentStep > min) {
            setStep((currentStep - 1));
            setError('');
        }
    };
    const handlePlanCheckoutSubmit = (event) => {
        if (!formData.selectedPlanCode) {
            event.preventDefault();
            setError('Pick a plan to continue.');
            return;
        }
        setError('');
        setLoading(true);
        // Allow the form to submit naturally; it POSTs to /api/billing/subscription/checkout
        // which returns a 303 redirect to Stripe.
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (currentStep < 6) {
            handleNext();
            return;
        }
        setLoading(true);
        try {
            let profileImageUrl = '';
            if (formData.profileImage) {
                const { url, error: imageError } = await uploadProfileImage(formData.profileImage);
                if (imageError) {
                    console.warn('Profile image upload failed:', imageError);
                }
                else if (url) {
                    profileImageUrl = url;
                }
            }
            const { data: { user: currentUser } } = await (await import('@/components/e7335a071b71')).createClient().auth.getUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            const allDocuments = [
                formData.licenseDocument,
                formData.resumeDocument,
                ...formData.additionalDocuments,
            ].filter((doc) => doc !== null);
            const allKinds = [
                formData.licenseDocument ? 'license' : null,
                formData.resumeDocument ? 'resume' : null,
                ...formData.additionalDocuments.map(() => 'additional'),
            ].filter((kind) => kind !== null);
            let documentUrls = [];
            if (allDocuments.length > 0) {
                setUploading(true);
                try {
                    const { paths, error: uploadError } = await uploadCredentials(currentUser.id, allDocuments, allKinds);
                    if (uploadError) {
                        setError(`Document upload failed: ${uploadError}`);
                        setLoading(false);
                        setUploading(false);
                        return;
                    }
                    documentUrls = paths || [];
                }
                catch (uploadErr) {
                    setError(`Document upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`);
                    setLoading(false);
                    setUploading(false);
                    return;
                }
                finally {
                    setUploading(false);
                }
            }
            const onboardingFormData = new FormData();
            onboardingFormData.append('displayName', formData.displayName);
            onboardingFormData.append('phone', usNationalDigitsToE164(formData.phone) || '');
            onboardingFormData.append('licenseNumber', formData.license_number);
            formData.licensed_states.forEach((s) => onboardingFormData.append('licensedStates', s));
            onboardingFormData.append('state', formData.licensed_states[0] || '');
            onboardingFormData.append('experience', formData.years_experience);
            onboardingFormData.append('rate', formData.rate);
            onboardingFormData.append('bio', formData.bio);
            onboardingFormData.append('allowSelfBooking', String(formData.allow_self_booking));
            onboardingFormData.append('calendarVisible', String(formData.calendar_visible));
            formData.specialties.forEach((specialty) => {
                onboardingFormData.append('specialties', specialty);
            });
            if (profileImageUrl) {
                onboardingFormData.append('profileImageUrl', profileImageUrl);
            }
            onboardingFormData.append('availability', JSON.stringify(formData.availability));
            const { completeTherapistOnboarding } = await import('@/components/8563fc9663ca');
            await completeTherapistOnboarding(onboardingFormData);
            reset();
            window.location.href = '/status';
        }
        catch (err) {
            if (err &&
                typeof err === 'object' &&
                'digest' in err &&
                typeof err.digest === 'string' &&
                err.digest.startsWith('NEXT_REDIRECT')) {
                throw err;
            }
            setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
            setLoading(false);
            setUploading(false);
        }
    };
    const handleChange = (e) => {
        updateFormData({ [e.target.name]: e.target.value });
        if (error)
            setError('');
    };
    const handleSpecialtyToggle = (specialty) => {
        updateFormData({
            specialties: formData.specialties.includes(specialty)
                ? formData.specialties.filter((s) => s !== specialty)
                : [...formData.specialties, specialty],
        });
    };
    const toggleLicensedState = (stateCode) => {
        const next = formData.licensed_states.includes(stateCode)
            ? formData.licensed_states.filter((s) => s !== stateCode)
            : [...formData.licensed_states, stateCode];
        updateFormData({ licensed_states: next });
        if (error)
            setError('');
    };
    const removeLicensedState = (stateCode) => {
        updateFormData({
            licensed_states: formData.licensed_states.filter((s) => s !== stateCode),
        });
        if (error)
            setError('');
    };
    const handleSingleFileChange = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                setError(`${field === 'licenseDocument' ? 'License' : 'Resume'} file must be less than 10MB`);
                return;
            }
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setError('Invalid file type. Only PDF, JPG, and PNG are allowed.');
                return;
            }
            updateFormData({ [field]: file });
            setError('');
        }
    };
    const handleAdditionalFilesChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const invalidFiles = files.filter((f) => f.size > 10 * 1024 * 1024);
            if (invalidFiles.length > 0) {
                setError(`Some files exceed 10MB limit: ${invalidFiles.map((f) => f.name).join(', ')}`);
                return;
            }
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            const invalidTypes = files.filter((f) => !validTypes.includes(f.type));
            if (invalidTypes.length > 0) {
                setError('Invalid file types. Only PDF, JPG, and PNG are allowed.');
                return;
            }
            updateFormData({
                additionalDocuments: [...formData.additionalDocuments, ...files],
            });
            setError('');
        }
    };
    const removeAdditionalFile = (index) => {
        updateFormData({
            additionalDocuments: formData.additionalDocuments.filter((_, i) => i !== index),
        });
    };
    const handleProfileImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setError('Profile image must be less than 5MB');
                return;
            }
            const imageUrl = URL.createObjectURL(file);
            updateFormData({ profileImage: file, profileImageUrl: imageUrl });
            setError('');
        }
    };
    // Step 2 (plan picker) submits to /api/billing/subscription/checkout which 303-redirects to Stripe.
    // We render the form here outside the main onboarding form so the action route is independent.
    const planForm = (<form action="/api/billing/subscription/checkout" method="post" onSubmit={handlePlanCheckoutSubmit} id="plan-checkout-form">
      <input type="hidden" name="tierCode" value={formData.selectedPlanCode ?? ''}/>
      <input type="hidden" name="successPath" value="/login?step=3&checkout=success"/>
      <input type="hidden" name="cancelPath" value="/login?step=2&checkout=cancelled"/>
    </form>);
    return (<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 lg:p-10 mt-6 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-gray-600">Overall Progress</span>
          <span className="text-gray-900">{formProgress}%</span>
        </div>
        <Progress value={formProgress} className="h-2 [&>div]:bg-primary"/>
      </div>

      <nav aria-label="Onboarding steps" className="overflow-x-auto">
        <div className="flex items-center justify-between min-w-max gap-0 py-2">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            return (<div key={step.number} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div aria-current={isActive ? 'step' : undefined} aria-label={`Step ${step.number}: ${step.name}`} className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all shrink-0
                      ${isActive ? 'border-primary bg-primary text-primary-foreground ring-2 ring-primary/20' : ''}
                      ${isCompleted ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${!isActive && !isCompleted ? 'border-gray-200 bg-white text-gray-400' : ''}
                    `}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5"/> : step.number}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center hidden sm:block truncate max-w-[4.5rem] ${isActive ? 'text-primary' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (<div className={`flex-1 h-0.5 mx-1 min-w-[12px] max-w-[24px] sm:max-w-none ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`}/>)}
              </div>);
        })}
        </div>
      </nav>

      {error && (<Alert variant="destructive">
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription>{error}</AlertDescription>
        </Alert>)}

      {/* Plan-picker form (outside the onboarding form so it can submit independently to Stripe). */}
      {currentStep === 2 && planForm}

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (<div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-muted-foreground">Add your basic details so clients can find you.</p>
            </div>

            <div className="rounded-lg border border-dashed border-gray-200 bg-muted/30 p-6">
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-20 w-20 border-2 border-gray-200">
                  {formData.profileImageUrl ? (<AvatarImage src={formData.profileImageUrl} alt="Profile preview"/>) : (<AvatarFallback className="bg-gray-100 text-gray-600">
                      <User className="h-8 w-8"/>
                    </AvatarFallback>)}
                </Avatar>
                <div className="text-center space-y-1">
                  <Label htmlFor="profile-image" className="cursor-pointer">
                    <span className="text-xs font-medium text-primary hover:underline">
                      {formData.profileImageUrl ? 'Change Photo' : 'Add Profile Picture (Optional)'}
                    </span>
                  </Label>
                  <Input id="profile-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileImageChange} disabled={loading} className="hidden"/>
                  <p className="text-xs text-gray-500">JPG, PNG or WEBP (max 5MB)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display Name *
              </Label>
              <Input id="displayName" name="displayName" type="text" required value={formData.displayName} onChange={handleChange} placeholder="Dr. Jane Smith" disabled={loading} className="h-10"/>
              <p className="text-xs text-muted-foreground">
                This is how clients will see your name on the platform.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input id="email" name="email" type="email" value={userEmail} disabled readOnly className="h-10 bg-muted/50 cursor-not-allowed"/>
              <p className="text-xs text-muted-foreground">
                Your email address is set and cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground"/>
                Phone Number (US)
              </Label>
              <UsPhoneInput id="phone" name="phone" value={formData.phone} onValueChange={(next) => {
                updateFormData({ phone: next });
                if (error)
                    setError('');
            }} placeholder="5550000000" disabled={loading}/>
              <p className="text-xs text-muted-foreground">
                Digits only. We store this as `+1` plus 10 digits.
              </p>
            </div>
          </div>)}

        {currentStep === 2 && (<TherapistPlanPickerStep tiers={tiers} selectedCode={formData.selectedPlanCode ?? ''} onSelect={(code) => {
                updateFormData({ selectedPlanCode: code });
                if (error)
                    setError('');
            }} isSubmitting={loading} error={error || undefined}/>)}

        {currentStep === 3 && (<div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Professional Information</h2>
              <p className="text-muted-foreground">Tell us about your professional background.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number" className="text-sm font-medium">
                License Number *
              </Label>
              <Input id="license_number" name="license_number" type="text" required value={formData.license_number} onChange={handleChange} placeholder="e.g., PSY123456" disabled={loading} className="h-10"/>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Licensed States *</Label>
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="space-y-2">
                  <Input value={stateQuery} onChange={(e) => setStateQuery(e.target.value)} placeholder="Search states (e.g. California)" disabled={loading} className="h-10"/>

                  {formData.licensed_states.length > 0 ? (<div className="flex flex-wrap gap-2">
                      {formData.licensed_states.map((code) => {
                    const label = US_STATES.find((s) => s.value === code)?.label || code;
                    return (<Badge key={code} variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            <span className="mr-2">{label}</span>
                            <button type="button" onClick={() => removeLicensedState(code)} className="text-gray-500 hover:text-gray-900" aria-label={`Remove ${label}`} disabled={loading}>
                              <XCircle className="h-3.5 w-3.5"/>
                            </button>
                          </Badge>);
                })}
                    </div>) : (<p className="text-xs text-muted-foreground">
                      Select one or more states where you hold an active professional license.
                    </p>)}
                </div>

                <div className="max-h-56 overflow-auto rounded-md border border-gray-200 bg-white">
                  <div className="divide-y divide-gray-100">
                    {US_STATES.filter((s) => {
                const q = stateQuery.trim().toLowerCase();
                if (!q)
                    return true;
                return s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q);
            }).map((state) => {
                const selected = formData.licensed_states.includes(state.value);
                return (<button key={state.value} type="button" onClick={() => toggleLicensedState(state.value)} disabled={loading} className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 ${selected ? 'bg-primary/5' : ''}`}>
                          <span className="text-gray-900">
                            {state.label} <span className="text-gray-500">({state.value})</span>
                          </span>
                          {selected ? (<CheckCircle2 className="h-4 w-4 text-primary"/>) : (<span className="h-4 w-4"/>)}
                        </button>);
            })}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Your profile will show the states you&rsquo;re licensed in.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_experience" className="text-sm font-medium">
                Years of Experience *
              </Label>
              <Input id="years_experience" name="years_experience" type="number" required value={formData.years_experience} onChange={handleChange} placeholder="5" min="0" disabled={loading} className="h-10"/>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <Label className="text-sm font-medium">Specialties * (Select at least one)</Label>
              <div className="flex flex-wrap gap-2">
                {THERAPIST_SPECIALTIES.map((specialty) => (<Badge key={specialty} variant={formData.specialties.includes(specialty) ? 'default' : 'outline'} className="cursor-pointer px-3 py-1 text-xs hover:bg-gray-100 transition-colors" onClick={() => handleSpecialtyToggle(specialty)}>
                    {formData.specialties.includes(specialty) && (<CheckCircle2 className="h-3 w-3 mr-1"/>)}
                    {specialty}
                  </Badge>))}
              </div>
              <p className="text-xs text-muted-foreground">Selected: {formData.specialties.length}</p>
            </div>
          </div>)}

        {currentStep === 4 && (<div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Practice Details</h2>
              <p className="text-muted-foreground">Set your rate and share your approach.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate" className="text-sm font-medium">
                Hourly Rate (USD) *
              </Label>
              <Input id="rate" name="rate" type="number" required value={formData.rate} onChange={handleChange} placeholder="100" min="0" step="0.01" disabled={loading} className="h-10"/>
              <p className="text-xs text-muted-foreground">Your standard hourly rate for therapy sessions.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Professional Bio *
              </Label>
              <Textarea id="bio" name="bio" required value={formData.bio} onChange={handleChange} placeholder="Share your therapeutic approach, experience, and what makes you unique..." disabled={loading} rows={5} className="resize-none min-h-[120px]"/>
              <p className="text-xs text-muted-foreground">{formData.bio.length} / 1000 characters</p>
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-transparent bg-background p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Allow clients to self-book</p>
                  <p className="text-xs text-muted-foreground">
                    If off, booking stays visible but disabled with a message CTA.
                  </p>
                </div>
                <Switch checked={formData.allow_self_booking} onCheckedChange={(checked) => updateFormData({ allow_self_booking: checked })} disabled={loading}/>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-transparent bg-background p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Calendar visibility</p>
                  <p className="text-xs text-muted-foreground">
                    Controls whether seekers can see available time slots.
                  </p>
                </div>
                <Switch checked={formData.calendar_visible} onCheckedChange={(checked) => updateFormData({ calendar_visible: checked })} disabled={loading}/>
              </div>
            </div>
          </div>)}

        {currentStep === 5 && (<div className="space-y-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Availability Schedule</h2>
                <p className="text-muted-foreground">Set your weekly availability for client sessions.</p>
              </div>
              <Button type="button" variant="outline" className="shrink-0" disabled={loading} onClick={() => {
                persistStepToServer(5);
                setStep(6);
                setError('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
                Skip for now
              </Button>
            </div>

            <AvailabilityEditor value={formData.availability} onChange={(availability) => {
                updateFormData({ availability });
                if (error)
                    setError('');
            }}/>
          </div>)}

        {currentStep === 6 && (<div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Credentials & Licenses</h2>
              <p className="text-muted-foreground">Upload your professional documents for verification.</p>
            </div>

            <div className="space-y-3">
              <div className={`border-2 rounded-lg p-4 ${formData.licenseDocument ? 'border-gray-300 bg-gray-50' : 'border-dashed border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${formData.licenseDocument
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-100 text-gray-600'}`}>
                    <Award className="h-4 w-4"/>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="license-upload" className="text-sm font-semibold cursor-pointer">
                        Professional License
                      </Label>
                      {formData.licenseDocument && <CheckCircle2 className="h-4 w-4 text-green-600"/>}
                    </div>
                    <p className="text-xs text-gray-600">
                      Upload your active state license (e.g., Medical License, Psychology License)
                    </p>

                    {formData.licenseDocument ? (<div className="flex items-center gap-2 mt-2 p-2 bg-white rounded border border-gray-200 text-xs">
                        <FileText className="h-3 w-3 text-gray-500"/>
                        <span className="truncate flex-1">{formData.licenseDocument.name}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-500 hover:text-red-600" onClick={() => updateFormData({ licenseDocument: null })}>
                          <XCircle className="h-3 w-3"/>
                        </Button>
                      </div>) : (<div className="mt-2">
                        <Label htmlFor="license-upload" className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                          <Upload className="h-3 w-3 mr-1.5"/>
                          Upload License
                        </Label>
                        <Input id="license-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleSingleFileChange(e, 'licenseDocument')} disabled={loading || uploading} className="hidden"/>
                      </div>)}
                  </div>
                </div>
              </div>

              <div className={`border-2 rounded-lg p-4 ${formData.resumeDocument ? 'border-gray-300 bg-gray-50' : 'border-dashed border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${formData.resumeDocument
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-100 text-gray-600'}`}>
                    <FileText className="h-4 w-4"/>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="resume-upload" className="text-sm font-semibold cursor-pointer">
                        CV / Resume
                      </Label>
                      {formData.resumeDocument && <CheckCircle2 className="h-4 w-4 text-green-600"/>}
                    </div>
                    <p className="text-xs text-gray-600">Upload your current Curriculum Vitae or Resume</p>

                    {formData.resumeDocument ? (<div className="flex items-center gap-2 mt-2 p-2 bg-white rounded border border-gray-200 text-xs">
                        <FileText className="h-3 w-3 text-gray-500"/>
                        <span className="truncate flex-1">{formData.resumeDocument.name}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-500 hover:text-red-600" onClick={() => updateFormData({ resumeDocument: null })}>
                          <XCircle className="h-3 w-3"/>
                        </Button>
                      </div>) : (<div className="mt-2">
                        <Label htmlFor="resume-upload" className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                          <Upload className="h-3 w-3 mr-1.5"/>
                          Upload Resume
                        </Label>
                        <Input id="resume-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleSingleFileChange(e, 'resumeDocument')} disabled={loading || uploading} className="hidden"/>
                      </div>)}
                  </div>
                </div>
              </div>

              <div className="border-dashed border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                    <Upload className="h-4 w-4"/>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="additional-upload" className="text-sm font-semibold cursor-pointer">
                      Additional Certifications (Optional)
                    </Label>
                    <p className="text-xs text-gray-600">
                      Upload any other relevant certifications or documents
                    </p>

                    <div className="mt-2">
                      <Label htmlFor="additional-upload" className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <Upload className="h-3 w-3 mr-1.5"/>
                        Add Files
                      </Label>
                      <Input id="additional-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleAdditionalFilesChange} disabled={loading || uploading} className="hidden"/>
                    </div>

                    {formData.additionalDocuments.length > 0 && (<div className="mt-3 space-y-1.5">
                        {formData.additionalDocuments.map((file, index) => (<div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                            <span className="truncate flex-1">{file.name}</span>
                            <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-500 hover:text-red-600" onClick={() => removeAdditionalFile(index)}>
                              <XCircle className="h-3 w-3"/>
                            </Button>
                          </div>))}
                      </div>)}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4"/>
                <AlertDescription className="text-xs">
                  Your application will be reviewed by our admin team. You&apos;ll receive an email once approved.
                </AlertDescription>
              </Alert>
            </div>
          </div>)}

        <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200 sticky bottom-0 bg-white pb-2 -mb-2">
          <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1 || (hasSubscription && currentStep <= 3) || loading} className="h-10 min-w-[100px]">
            <ArrowLeft className="h-4 w-4 mr-2"/>
            Back
          </Button>

          {currentStep === 2 ? (<Button type="submit" form="plan-checkout-form" disabled={loading || !formData.selectedPlanCode} className="h-10 min-w-[200px]">
              {loading ? (<>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  Redirecting...
                </>) : (<>
                  Continue to checkout
                  <ArrowRight className="h-4 w-4 ml-2"/>
                </>)}
            </Button>) : (<Button type="submit" disabled={loading || uploading} className="h-10 min-w-[140px]">
              {loading || uploading ? (<>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  {uploading ? 'Uploading...' : 'Creating...'}
                </>) : currentStep === 6 ? ('Submit for review') : (<>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2"/>
                </>)}
            </Button>)}
        </div>
      </form>
    </div>);
}
