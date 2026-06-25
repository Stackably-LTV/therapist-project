export const MAX_CHAT_ATTACHMENT_BYTES = 50 * 1024 * 1024;
export const CHAT_ATTACHMENT_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];
const CHAT_ATTACHMENT_EXTENSION_ALLOWLIST = new Set([
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.doc',
    '.docx',
    '.txt',
]);
export const CHAT_ATTACHMENT_ACCEPT = `${CHAT_ATTACHMENT_MIME_TYPES.join(',')},.pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.txt`;
export function isAllowedChatAttachment(file) {
    const mimeType = (file.type || '').trim().toLowerCase();
    if (mimeType && CHAT_ATTACHMENT_MIME_TYPES.includes(mimeType)) {
        return true;
    }
    const fileName = (file.name || '').toLowerCase();
    const extensionMatch = fileName.match(/\.[^.]+$/);
    const extension = extensionMatch ? extensionMatch[0] : '';
    return CHAT_ATTACHMENT_EXTENSION_ALLOWLIST.has(extension);
}
