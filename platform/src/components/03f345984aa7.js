/**
 * The cancellation questionnaire — single source of truth.
 *
 * Drives the therapist-facing form, the server-side validation, and the
 * admin-facing answer display. Add/edit questions here and every surface stays
 * in sync. `id` values are persisted into the `responses` JSONB column, so treat
 * them as stable keys: rename a prompt freely, but don't rename an `id`.
 */
export const CANCELLATION_QUESTIONS = [
    {
        id: 'primary_reason',
        prompt: "What's the main reason you're cancelling?",
        type: 'single',
        required: true,
        options: [
            { value: 'too_expensive', label: 'Too expensive for the value I get' },
            { value: 'not_enough_clients', label: "I'm not getting enough clients" },
            { value: 'missing_features', label: 'Missing features I need' },
            { value: 'switching', label: "I'm switching to another platform" },
            { value: 'closing_practice', label: "I'm closing or pausing my practice" },
            { value: 'technical_issues', label: 'Too many technical problems' },
            { value: 'hard_to_use', label: 'The platform is hard to use' },
            { value: 'other', label: 'Other' },
        ],
    },
    {
        id: 'tenure',
        prompt: 'How long have you been subscribed?',
        type: 'single',
        required: true,
        options: [
            { value: 'lt_1m', label: 'Less than 1 month' },
            { value: '1_3m', label: '1–3 months' },
            { value: '3_6m', label: '3–6 months' },
            { value: '6_12m', label: '6–12 months' },
            { value: 'gt_12m', label: 'More than a year' },
        ],
    },
    {
        id: 'usage_frequency',
        prompt: 'How often did you actually use the platform?',
        type: 'single',
        required: true,
        options: [
            { value: 'daily', label: 'Most days' },
            { value: 'weekly', label: 'A few times a week' },
            { value: 'monthly', label: 'A few times a month' },
            { value: 'rarely', label: 'Rarely' },
            { value: 'never', label: 'I never really got started' },
        ],
    },
    {
        id: 'features_used',
        prompt: 'Which features did you use? (Select all that apply)',
        type: 'multi',
        required: true,
        options: [
            { value: 'scheduling', label: 'Scheduling & calendar' },
            { value: 'video', label: 'Video sessions' },
            { value: 'messaging', label: 'Client messaging' },
            { value: 'notes', label: 'Session & progress notes' },
            { value: 'charts', label: 'Client charts / records' },
            { value: 'treatment_plans', label: 'Treatment plans' },
            { value: 'courses', label: 'Courses' },
            { value: 'community', label: 'Community' },
            { value: 'billing', label: 'Billing & payouts' },
            { value: 'none', label: 'None of these' },
        ],
    },
    {
        id: 'most_valuable_feature',
        prompt: 'Which single feature was most valuable to you, and why?',
        type: 'text',
        required: true,
        multiline: true,
        placeholder: 'e.g. The video sessions saved me from juggling a separate Zoom account…',
    },
    {
        id: 'missing_needs',
        prompt: 'What did you need that the platform did not provide?',
        type: 'text',
        required: true,
        multiline: true,
        placeholder: 'Be specific — this is the feedback that actually changes the product.',
    },
    {
        id: 'value_for_money',
        prompt: 'How would you rate the value for money?',
        type: 'scale',
        required: true,
        min: 1,
        max: 5,
        minLabel: 'Poor value',
        maxLabel: 'Excellent value',
    },
    {
        id: 'clients_acquired',
        prompt: 'Roughly how many clients did you gain through the platform?',
        type: 'single',
        required: true,
        options: [
            { value: '0', label: 'None' },
            { value: '1_2', label: '1–2' },
            { value: '3_5', label: '3–5' },
            { value: '6_10', label: '6–10' },
            { value: 'gt_10', label: 'More than 10' },
        ],
    },
    {
        id: 'goals_met',
        prompt: 'Did the platform help you reach the goals you signed up for?',
        type: 'single',
        required: true,
        options: [
            { value: 'yes', label: 'Yes, fully' },
            { value: 'partially', label: 'Partially' },
            { value: 'no', label: 'No' },
        ],
    },
    {
        id: 'switching_to',
        prompt: 'If you are switching, what are you switching to? (Leave blank if not switching)',
        type: 'text',
        required: false,
        placeholder: 'Platform name or "staying solo / paper"',
    },
    {
        id: 'what_would_keep_you',
        prompt: 'What is the one change that would have made you stay?',
        type: 'text',
        required: true,
        multiline: true,
        placeholder: 'A feature, a lower price, better onboarding…',
    },
    {
        id: 'discount_would_help',
        prompt: 'Would a discount change your mind?',
        type: 'single',
        required: true,
        options: [
            { value: 'yes', label: 'Yes' },
            { value: 'maybe', label: 'Maybe, depends how much' },
            { value: 'no', label: 'No — price is not the issue' },
        ],
    },
    {
        id: 'nps',
        prompt: 'How likely are you to recommend us to another therapist?',
        type: 'scale',
        required: true,
        min: 0,
        max: 10,
        minLabel: 'Not at all likely',
        maxLabel: 'Extremely likely',
    },
    {
        id: 'biggest_frustration',
        prompt: 'What frustrated you the most while using the platform?',
        type: 'text',
        required: true,
        multiline: true,
        placeholder: 'The thing that made you sigh.',
    },
    {
        id: 'contacted_support',
        prompt: 'Did you contact support, and how did it go?',
        type: 'single',
        required: true,
        options: [
            { value: 'never', label: 'Never contacted support' },
            { value: 'good', label: 'Yes — they resolved it' },
            { value: 'slow', label: 'Yes — but it was slow' },
            { value: 'unresolved', label: 'Yes — my issue was never resolved' },
        ],
    },
    {
        id: 'technical_issues',
        prompt: 'Describe any technical issues or bugs you ran into.',
        type: 'text',
        required: false,
        multiline: true,
        placeholder: 'Crashes, slow pages, video dropping, billing errors…',
    },
    {
        id: 'price_vs_alternatives',
        prompt: 'Compared to alternatives you know, our pricing felt…',
        type: 'single',
        required: true,
        options: [
            { value: 'much_cheaper', label: 'Much cheaper' },
            { value: 'cheaper', label: 'A bit cheaper' },
            { value: 'same', label: 'About the same' },
            { value: 'expensive', label: 'A bit expensive' },
            { value: 'much_expensive', label: 'Much more expensive' },
        ],
    },
    {
        id: 'would_return',
        prompt: 'Could you see yourself coming back in the future?',
        type: 'single',
        required: true,
        options: [
            { value: 'yes', label: 'Yes, likely' },
            { value: 'maybe', label: 'Maybe, if things improve' },
            { value: 'no', label: 'No' },
        ],
    },
    {
        id: 'follow_up_ok',
        prompt: 'May we reach out to learn more about your experience?',
        type: 'single',
        required: true,
        options: [
            { value: 'yes', label: "Yes, that's fine" },
            { value: 'no', label: 'No, please cancel without contact' },
        ],
    },
    {
        id: 'open_feedback',
        prompt: 'Anything else you want the team to know before you go?',
        type: 'text',
        required: true,
        multiline: true,
        placeholder: 'Final thoughts — the good, the bad, all of it.',
    },
];
export const REQUIRED_QUESTION_IDS = CANCELLATION_QUESTIONS.filter((q) => q.required).map((q) => q.id);
export function validateResponses(raw) {
    const errors = [];
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, errors: ['Responses are missing or malformed.'] };
    }
    const map = raw;
    for (const q of CANCELLATION_QUESTIONS) {
        const answer = map[q.id];
        if (q.type === 'multi') {
            const arr = Array.isArray(answer)
                ? answer.filter((v) => typeof v === 'string')
                : [];
            if (q.required && arr.length === 0) {
                errors.push(`"${q.prompt}" requires at least one selection.`);
            }
            // Drop unknown option values.
            out[q.id] = arr.filter((v) => q.options?.some((o) => o.value === v));
            continue;
        }
        const value = typeof answer === 'string'
            ? answer.trim()
            : typeof answer === 'number'
                ? String(answer)
                : '';
        if (q.required && value === '') {
            errors.push(`"${q.prompt}" is required.`);
            continue;
        }
        if (value !== '' && q.options && !q.options.some((o) => o.value === value)) {
            errors.push(`"${q.prompt}" has an invalid selection.`);
            continue;
        }
        if (value !== '' && q.type === 'scale') {
            const n = Number(value);
            if (!Number.isFinite(n) || n < (q.min ?? 0) || n > (q.max ?? 10)) {
                errors.push(`"${q.prompt}" must be between ${q.min} and ${q.max}.`);
                continue;
            }
        }
        out[q.id] = value;
    }
    if (errors.length > 0)
        return { ok: false, errors };
    return { ok: true, responses: out };
}
/** Human label lookup for a stored answer value (used by the admin view). */
export function labelForAnswer(question, value) {
    if (value == null || value === '')
        return '—';
    if (question.type === 'multi' && Array.isArray(value)) {
        return value
            .map((v) => question.options?.find((o) => o.value === v)?.label ?? String(v))
            .join(', ');
    }
    if (question.options) {
        return question.options.find((o) => o.value === value)?.label ?? String(value);
    }
    return String(value);
}
