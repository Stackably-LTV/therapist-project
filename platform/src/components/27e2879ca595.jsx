'use client';
import { useState } from 'react';
export default function RejectTherapistModal({ therapistId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('therapistId', therapistId);
            formData.append('reason', reason);
            const response = await fetch('/api/admin/reject-therapist', {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                // Redirect on success
                window.location.href = '/admin';
            }
            else {
                alert('Failed to reject therapist. Please try again.');
                setIsSubmitting(false);
            }
        }
        catch (error) {
            console.error('Error rejecting therapist:', error);
            alert('An error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };
    return (<>
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
        Reject
      </button>

      {isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reject Application</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Incomplete license documentation, or leave blank for generic rejection" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none" rows={3}/>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  The therapist will receive an email notification. Their therapist role will be removed —
                  they can sign back in and reapply via the signup flow.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => {
                setIsOpen(false);
                setReason('');
            }} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </>);
}
