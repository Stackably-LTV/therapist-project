import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/components/9a6b39502e62';
import Link from 'next/link';
export default async function SeekerNoteDetailPage({ params, }) {
    const { noteId } = await params;
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        redirect('/login');
    const { data: profileRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (!profileRow || profileRow.role !== 'seeker') {
        redirect('/login');
    }
    const { data: note } = await supabase
        .from('clinical_provider_notes')
        .select('id, title, content, note_type, created_at, therapist_id')
        .eq('id', noteId)
        .eq('seeker_id', user.id)
        .eq('is_private', false)
        .maybeSingle();
    if (!note)
        notFound();
    const { data: therapistProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', note.therapist_id)
        .single();
    const therapistName = therapistProfile?.full_name;
    return (<div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-4">
        <Link href="/seeker/chart" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 hover:text-gray-700">
          Back to My Chart
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="border-b border-gray-200 pb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Therapist note</div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{note.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {therapistName ? `By ${therapistName} · ` : ''}
            {new Date(note.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-6 whitespace-pre-wrap text-sm text-gray-800">
          {note.content || 'No details available.'}
        </div>
      </div>
    </div>);
}
