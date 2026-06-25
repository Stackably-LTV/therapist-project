import { LandingNavbar } from '@/components/30855a90370e';
import { LandingFooter } from '@/components/fc5d251783ab';
export default function PublicLayout({ children, }) {
    return (<div className="min-h-screen flex flex-col" suppressHydrationWarning>
      <LandingNavbar />
      
      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      <LandingFooter />
    </div>);
}
