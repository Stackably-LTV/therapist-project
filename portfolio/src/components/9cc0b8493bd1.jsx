'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/components/90ceaf45bd61';
import { TooltipProvider } from '@/components/943378a021ef';
import { Toaster } from '@/components/080c1fea579c';
export function ClientProviders({ children }) {
    return (<QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>);
}
