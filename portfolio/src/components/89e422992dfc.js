'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
// Generate a simple session ID (stored in sessionStorage)
const getSessionId = () => {
    if (typeof window === 'undefined')
        return null;
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};
// Generate a device ID (stored in localStorage for persistence)
const getDeviceId = () => {
    if (typeof window === 'undefined')
        return null;
    let deviceId = localStorage.getItem('analytics_device_id');
    if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('analytics_device_id', deviceId);
    }
    return deviceId;
};
export function useAnalytics() {
    const pathname = usePathname();
    useEffect(() => {
        // Skip tracking for admin routes
        if (pathname?.startsWith('/admin'))
            return;
        const trackPageView = async () => {
            try {
                const sessionId = getSessionId();
                const deviceId = getDeviceId();
                // Use keepalive to ensure request completes even during page navigation
                await fetch('/api/analytics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        eventType: 'pageview',
                        path: pathname,
                        origin: window.location.origin,
                        sessionId,
                        deviceId,
                        referrer: document.referrer,
                        userAgent: navigator.userAgent,
                    }),
                    keepalive: true, // Ensures request completes even if user navigates away
                });
            }
            catch (error) {
                // Silent fail - don't disrupt user experience
                console.debug('Analytics tracking failed:', error);
            }
        };
        trackPageView();
    }, [pathname]);
}
export function trackEvent(eventName, eventData) {
    try {
        const sessionId = getSessionId();
        const deviceId = getDeviceId();
        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventType: 'event',
                eventName,
                eventData: JSON.stringify(eventData),
                path: window.location.pathname,
                origin: window.location.origin,
                sessionId,
                deviceId,
            }),
            keepalive: true, // Ensures request completes even if user navigates away
        }).catch(() => {
            // Silent fail
        });
    }
    catch (error) {
        console.debug('Event tracking failed:', error);
    }
}
