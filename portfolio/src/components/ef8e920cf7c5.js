import { configuredLexicalEditor } from '@/components/36a90b146699';
export const Posts = {
    slug: 'posts',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'publishedDate', 'updatedAt'],
        group: 'Management',
        description: 'Manage your blog posts. Featured images are optional - placeholders will be used if not provided.',
    },
    access: {
        read: () => true,
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
        delete: ({ req: { user } }) => Boolean(user),
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            admin: {
                description: 'The title of your blog post',
            },
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'URL-friendly version of the title (auto-generated if left empty)',
                position: 'sidebar',
            },
            hooks: {
                beforeValidate: [
                    ({ value, data }) => {
                        if (!value && data?.title) {
                            return data.title
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                        }
                        return value;
                    },
                ],
            },
        },
        {
            name: 'excerpt',
            type: 'textarea',
            required: true,
            admin: {
                description: 'Short description of the post (used in previews and SEO)',
                placeholder: 'Write a brief summary of your post...',
            },
        },
        {
            name: 'content',
            type: 'richText',
            required: true,
            editor: configuredLexicalEditor(),
            admin: {
                description: 'Main content of the blog post. Paste markdown to auto-convert it, or use code blocks with syntax highlighting.',
            },
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Main image for the blog post. If not provided, a placeholder will be used.',
                position: 'sidebar',
            },
        },
        {
            name: 'author',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            defaultValue: ({ user }) => user?.id,
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'tags',
            type: 'text',
            hasMany: true,
            admin: {
                description: 'Add tags separated by commas',
                position: 'sidebar',
            },
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'draft',
            options: [
                {
                    label: 'Draft',
                    value: 'draft',
                },
                {
                    label: 'Published',
                    value: 'published',
                },
                {
                    label: 'Archived',
                    value: 'archived',
                },
            ],
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'publishedDate',
            type: 'date',
            admin: {
                description: 'Date when the post should be published',
                position: 'sidebar',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
            hooks: {
                beforeChange: [
                    ({ value, data }) => {
                        // Auto-set published date when status changes to published
                        if (data?.status === 'published' && !value) {
                            return new Date().toISOString();
                        }
                        return value;
                    },
                ],
            },
        },
        {
            name: 'readingTime',
            type: 'number',
            admin: {
                description: 'Estimated reading time in minutes',
                position: 'sidebar',
            },
        },
    ],
    timestamps: true,
    versions: {
        drafts: true,
    },
    hooks: {
        afterChange: [
            async ({ doc, req, operation }) => {
                // Auto-calculate reading time based on actual text content
                // Skip for drafts to avoid conflicts during version saving
                if ((operation === 'create' || operation === 'update') &&
                    doc?.id &&
                    doc?.content &&
                    doc?.status === 'published') {
                    // Use setTimeout to defer the update, avoiding write conflicts with version saving
                    setTimeout(async () => {
                        try {
                            // Re-fetch the document to ensure we have the latest data
                            const freshDoc = await req.payload.findByID({
                                collection: 'posts',
                                id: doc.id,
                                depth: 0,
                            });
                            if (!freshDoc?.content)
                                return;
                            // Extract text from Lexical JSON structure
                            function extractText(node) {
                                if (!node)
                                    return '';
                                let text = '';
                                // If node has text property, use it
                                if (typeof node.text === 'string') {
                                    text += node.text + ' ';
                                }
                                // Recursively extract text from children
                                if (Array.isArray(node.children)) {
                                    text += node.children.map((child) => extractText(child)).join(' ');
                                }
                                return text;
                            }
                            const rootNode = freshDoc.content?.root || {};
                            const fullText = extractText(rootNode).trim();
                            const wordCount = fullText.split(/\s+/).filter((word) => word.length > 0).length;
                            const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 200));
                            // Only update if reading time has changed
                            if (!freshDoc.readingTime || freshDoc.readingTime !== estimatedMinutes) {
                                // Retry logic for MongoDB write conflicts
                                let retries = 3;
                                while (retries > 0) {
                                    try {
                                        await req.payload.update({
                                            collection: 'posts',
                                            id: doc.id,
                                            data: {
                                                readingTime: estimatedMinutes,
                                            },
                                            overrideAccess: true,
                                        });
                                        break; // Success, exit retry loop
                                    }
                                    catch (updateError) {
                                        retries--;
                                        // If it's a write conflict (code 112) and we have retries left, wait and retry
                                        if (updateError?.code === 112 &&
                                            updateError?.codeName === 'WriteConflict' &&
                                            retries > 0) {
                                            await new Promise((resolve) => setTimeout(resolve, 100 * (4 - retries))); // Exponential backoff
                                            continue;
                                        }
                                        // Otherwise, throw the error
                                        throw updateError;
                                    }
                                }
                            }
                        }
                        catch (error) {
                            // Silently fail - reading time is optional
                            // Log error but don't throw - this shouldn't block post creation/updates
                            if (error instanceof Error) {
                                console.error('Error calculating reading time:', error.message);
                            }
                            else {
                                console.error('Error calculating reading time:', error);
                            }
                        }
                    }, 500); // Wait 500ms to let version saving complete
                }
            },
        ],
    },
};
