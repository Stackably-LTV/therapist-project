import { redirect } from 'next/navigation';
export default async function ClientTasksPage({ searchParams, }) {
    const params = await searchParams;
    const status = params.status || 'all';
    redirect(`/seeker/chart?tab=tasks&status=${encodeURIComponent(status)}`);
}
