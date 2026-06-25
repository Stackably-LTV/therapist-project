import { createServerFeature } from '@payloadcms/richtext-lexical';
export const MarkdownPasteFeature = createServerFeature({
    feature: {
        ClientFeature: '@/fields/features/markdownPaste/client#MarkdownPasteClientFeature',
    },
    key: 'markdownPaste',
});
