import { Inter } from 'next/font/google';
import '@/components/7e0beae56741.css';
import { ClientProviders } from '@/components/9cc0b8493bd1';
import { ClientLayout } from '@/components/ebdfe26ec596';
import { Analytics } from '@vercel/analytics/react';
const inter = Inter({ subsets: ['latin'] });
export const metadata = {
    title: 'Not Your Traditional Therapist | Therapist Bethlehem PA | Psychologist Easton PA Allentown PA',
    description: 'Expert Therapist Bethlehem PA offering trauma intensives, OCD treatment, anxiety therapy. Psychologist serving Easton PA, Allentown PA, Lehigh Valley with CPT, PE, ERP therapy.',
    keywords: 'Therapist Bethlehem PA, Psychologist Bethlehem PA, Therapist Easton PA, Therapist Allentown PA, Therapy Lehigh Valley, Psychologist Easton PA, Psychologist Allentown PA, OCD treatment, trauma therapy, anxiety therapist',
    openGraph: {
        title: 'Therapist Bethlehem PA | Psychologist Easton PA | Therapy Lehigh Valley',
        description: 'Expert Therapist Bethlehem PA serving Easton PA, Allentown PA, Lehigh Valley with trauma intensives, OCD treatment, anxiety therapy',
        type: 'website',
    },
};
export default function FrontendLayout({ children, }) {
    return (<html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body className={inter.className}>
        <ClientProviders>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ClientProviders>
        <Analytics />
      </body>
    </html>);
}
