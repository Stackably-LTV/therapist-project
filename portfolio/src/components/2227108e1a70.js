export const Media = {
    slug: 'media',
    access: {
        read: () => true,
    },
    admin: {
        useAsTitle: 'alt',
        defaultColumns: ['alt', 'updatedAt'],
        group: 'Management',
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            required: true,
            admin: {
                description: 'Alt text for the image (required for accessibility)',
                placeholder: 'Describe the image...',
            },
        },
    ],
    upload: true,
    hooks: {
        beforeChange: [
            ({ data }) => {
                // Auto-generate alt text if not provided
                if (!data?.alt && data?.filename) {
                    const filename = data.filename;
                    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
                    const formatted = nameWithoutExt
                        .split(/[-_\s]+/)
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    return {
                        ...data,
                        alt: formatted || 'Image',
                    };
                }
                return data;
            },
        ],
    },
};
