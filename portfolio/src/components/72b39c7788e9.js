import { useEffect } from 'react';
export function useVisitorTracking() {
    useEffect(() => {
        // Track visitor when component mounts (page load)
        const trackVisitor = async () => {
            try {
                await fetch('/api/track-visitor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        page: window.location.pathname,
                    }),
                });
            }
            catch (error) {
                // Silently fail - don't disrupt user experience
                console.debug('Visitor tracking failed:', error);
            }
        };
        trackVisitor();
    }, []); // Only run once when component mounts
}
