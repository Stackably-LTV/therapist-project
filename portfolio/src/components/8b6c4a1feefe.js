/**
 * Placeholder utilities for images and content
 */
const PLACEHOLDER_SERVICE = 'https://via.placeholder.com';
const placeholderSizes = {
    article: { width: 400, height: 250 },
    featured: { width: 800, height: 450 },
    blogPost: { width: 1200, height: 675 },
    avatar: { width: 200, height: 200 },
    category: { width: 300, height: 300 },
    thumbnail: { width: 150, height: 150 },
};
const placeholderColors = {
    article: { bg: 'f0f0f0', text: '666666' },
    featured: { bg: 'e0e0e0', text: '555555' },
    blogPost: { bg: 'd0d0d0', text: '444444' },
    avatar: { bg: 'cccccc', text: '333333' },
    category: { bg: 'bbbbbb', text: '222222' },
    thumbnail: { bg: 'aaaaaa', text: '111111' },
};
/**
 * Get a placeholder image URL
 */
export function getPlaceholderImage(type = 'article', text) {
    const size = placeholderSizes[type];
    const colors = placeholderColors[type];
    const placeholderText = text
        ? encodeURIComponent(text.substring(0, 20))
        : encodeURIComponent(`${type.toUpperCase()}`);
    return `${PLACEHOLDER_SERVICE}/${size.width}x${size.height}/${colors.bg}/${colors.text}?text=${placeholderText}`;
}
/**
 * Get image URL with fallback to placeholder
 */
export function getImageWithFallback(imageUrl, type = 'article', placeholderText) {
    if (!imageUrl) {
        return getPlaceholderImage(type, placeholderText);
    }
    return imageUrl;
}
/**
 * Get placeholder for empty text content
 */
export function getPlaceholderText(fieldName, defaultValue = '') {
    return defaultValue || `No ${fieldName} provided`;
}
/**
 * Get placeholder for author name
 */
export function getAuthorPlaceholder() {
    return 'Anonymous Author';
}
/**
 * Get placeholder for avatar
 */
export function getAvatarPlaceholder(name) {
    const initials = name
        ? name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        : 'AU';
    return getPlaceholderImage('avatar', initials);
}
