"use client";
import { SidebarTrigger } from '@/components/6dca437e8f95';
export function DashboardHeader({ userRole }) {
    return (<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1"/>
      <h1 className="text-lg font-semibold capitalize">{userRole} Dashboard</h1>
    </header>);
}
