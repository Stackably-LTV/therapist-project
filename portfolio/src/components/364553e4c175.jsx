'use client';
import { createClientFeature } from '@payloadcms/richtext-lexical/client';
import { MarkdownPastePlugin } from '@/components/d0dc484b2a8e';
export const MarkdownPasteClientFeature = createClientFeature({
    plugins: [
        {
            Component: MarkdownPastePlugin,
            position: 'normal',
        },
    ],
});
