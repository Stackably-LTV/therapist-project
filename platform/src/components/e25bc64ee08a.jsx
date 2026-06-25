'use client';
import { useEffect } from 'react';
export default function PrintTrigger() {
    useEffect(() => {
        const t = setTimeout(() => window.print(), 800);
        return () => clearTimeout(t);
    }, []);
    return (<button className="tp-print-btn" onClick={() => window.print()}>
      Print / Save as PDF
    </button>);
}
