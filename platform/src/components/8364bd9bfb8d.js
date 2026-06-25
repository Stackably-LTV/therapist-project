import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
const defaultFormData = {
    displayName: '',
    phone: '',
    profileImage: null,
    profileImageUrl: '',
    selectedPlanCode: '',
    license_number: '',
    licensed_states: [],
    specialties: [],
    years_experience: '',
    rate: '',
    bio: '',
    credentials: [],
    allow_self_booking: true,
    calendar_visible: true,
    availability: [],
    licenseDocument: null,
    degreeDocument: null,
    resumeDocument: null,
    additionalDocuments: [],
};
const initialState = {
    currentStep: 1,
    formData: defaultFormData,
    loading: false,
    error: '',
    uploading: false,
    stateQuery: '',
};
export const useTherapistOnboardingStore = create()(persist((set) => ({
    ...initialState,
    setStep(step) {
        set({ currentStep: step, error: '' });
    },
    setFormData(data) {
        set({ formData: data });
    },
    updateFormData(partial) {
        set((state) => ({
            formData: { ...state.formData, ...partial },
        }));
    },
    setError(error) {
        set({ error });
    },
    setLoading(loading) {
        set({ loading });
    },
    setUploading(uploading) {
        set({ uploading });
    },
    setStateQuery(stateQuery) {
        set({ stateQuery });
    },
    reset() {
        set({
            ...initialState,
            formData: { ...defaultFormData },
        });
    },
}), {
    name: 'therapist-onboarding',
    // Bumped after introducing the plan-picker step (selectedPlanCode field).
    // Older persisted shapes are discarded so we don't crash on missing fields.
    version: 2,
    migrate: () => ({ ...initialState, formData: { ...defaultFormData } }),
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({
        currentStep: state.currentStep,
        formData: {
            displayName: state.formData.displayName,
            phone: state.formData.phone,
            profileImageUrl: state.formData.profileImageUrl,
            selectedPlanCode: state.formData.selectedPlanCode,
            license_number: state.formData.license_number,
            licensed_states: state.formData.licensed_states,
            specialties: state.formData.specialties,
            years_experience: state.formData.years_experience,
            rate: state.formData.rate,
            bio: state.formData.bio,
            credentials: state.formData.credentials,
            allow_self_booking: state.formData.allow_self_booking,
            calendar_visible: state.formData.calendar_visible,
            availability: state.formData.availability,
            profileImage: null,
            licenseDocument: null,
            degreeDocument: null,
            resumeDocument: null,
            additionalDocuments: [],
        },
    }),
}));
