'use client';
import { useEffect, useState } from 'react';
export function useDiagnosisSearch(query, opts) {
    const minLength = opts?.minLength ?? 2;
    const limit = opts?.limit ?? 25;
    const debounceMs = opts?.debounceMs ?? 250;
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    useEffect(() => {
        const q = query.trim();
        if (q.length < minLength) {
            setResults([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        const t = window.setTimeout(async () => {
            try {
                const res = await fetch(`/api/diagnosis/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
                const data = await res.json().catch(() => ({}));
                if (!res.ok)
                    throw new Error(data?.error || 'Diagnosis search failed');
                if (cancelled)
                    return;
                const diagnoses = Array.isArray(data?.diagnoses) ? data.diagnoses : [];
                setResults(diagnoses.slice(0, Math.max(1, limit)));
            }
            catch {
                if (!cancelled)
                    setResults([]);
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        }, debounceMs);
        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
    }, [debounceMs, limit, minLength, query]);
    return { loading, results };
}
