'use client';
import Navbar from '@/components/264728403468';
import Footer from '@/components/12526a71a260';
import FloatingCTA from '@/components/04064358a9a0';
import { useAnalytics } from '@/components/89e422992dfc';
export function ClientLayout({ children }) {
    // Track page views automatically
    useAnalytics();
    return (<div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingCTA />
    </div>);
}
