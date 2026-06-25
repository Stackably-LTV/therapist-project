import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// ---------------------------------------------------------------------------
// Profile image URL resolver
// ---------------------------------------------------------------------------
export function getProfileImageUrl(profileJson) {
    if (!profileJson || typeof profileJson !== 'object')
        return null;
    const p = profileJson;
    const candidates = [
        p.profile_image_url,
        p.profileImageUrl,
        p.photoUrl,
        p.imageUrl,
        p.avatarUrl,
    ];
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim())
            return c.trim();
    }
    return null;
}
// ---------------------------------------------------------------------------
// US phone helpers
// ---------------------------------------------------------------------------
export function normalizeUsPhoneToNationalDigits(input) {
    const raw = (input ?? '').trim();
    if (!raw)
        return '';
    let digits = raw.replace(/\D/g, '');
    // Common paste format: +1XXXXXXXXXX or 1XXXXXXXXXX
    if (digits.length === 11 && digits.startsWith('1')) {
        digits = digits.slice(1);
    }
    // Keep at most 10 digits (US national number)
    if (digits.length > 10) {
        digits = digits.slice(0, 10);
    }
    return digits;
}
export function usNationalDigitsToE164(nationalDigits) {
    const digits = normalizeUsPhoneToNationalDigits(nationalDigits);
    if (!digits)
        return null;
    if (digits.length !== 10)
        return null;
    return `+1${digits}`;
}
