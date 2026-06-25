/**
 * Client-side wrappers around the two profile-upload API routes.
 * Server-side auth + storage handling lives in:
 *   - /api/storage/upload-profile-image
 *   - /api/storage/upload-credentials
 */
export async function uploadProfileImage(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/storage/upload-profile-image', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { path: null, url: null, error: errorData.error || 'Upload failed' };
        }
        const data = await response.json();
        return { path: data.path || null, url: data.url || null, error: null };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        console.error('Profile image upload error:', err);
        return { path: null, url: null, error: message };
    }
}
export async function uploadCredentials(_userId, files, kinds) {
    try {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append('files', file);
            formData.append('kinds', kinds?.[index] || 'additional');
        });
        const response = await fetch('/api/storage/upload-credentials', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json().catch(() => ({}));
        // 207 Multi-Status — some files succeeded, some failed.
        if (response.status === 207) {
            return {
                paths: data.paths || [],
                error: null,
                warnings: data.warnings || [],
            };
        }
        if (!response.ok) {
            return { paths: [], error: data.error || 'Upload failed' };
        }
        return { paths: data.paths || [], error: null };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        console.error('Credentials upload error:', err);
        return { paths: [], error: message };
    }
}
