import TherapistCalendarShell from '@/components/0932acfd4ef3';
export default function TherapistSchedule({ sessions, blocks, clients, }) {
    return <TherapistCalendarShell sessions={sessions} blocks={blocks} clients={clients}/>;
}
