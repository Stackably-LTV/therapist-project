'use client';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext';
import { $createTextNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, PASTE_COMMAND, } from '@payloadcms/richtext-lexical/lexical';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
export function MarkdownPastePlugin() {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        return editor.registerCommand(PASTE_COMMAND, (event) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData)
                return false;
            const markdown = clipboardData.getData('text/markdown') || clipboardData.getData('text/plain');
            // Check if the pasted text looks like markdown
            if (markdown && looksLikeMarkdown(markdown)) {
                event.preventDefault();
                editor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        try {
                            // Convert markdown to Lexical nodes
                            selection.removeText();
                            $convertFromMarkdownString(markdown, TRANSFORMERS);
                        }
                        catch (error) {
                            // If markdown conversion fails, insert as plain text
                            console.warn('Failed to parse markdown, inserting as plain text:', error);
                            const textNode = $createTextNode(markdown);
                            selection.insertNodes([textNode]);
                        }
                    }
                });
                return true;
            }
            // Let the default paste handler handle plain text
            return false;
        }, COMMAND_PRIORITY_LOW);
    }, [editor]);
    return null;
}
// Helper function to detect if text looks like markdown
function looksLikeMarkdown(text) {
    if (!text || text.length < 3)
        return false;
    const markdownPatterns = [
        /^#{1,6}\s+.+/m, // Headers
        /^\*\*.*\*\*/m, // Bold
        /^__.*__/m, // Bold alternative
        /^\*.*\*/m, // Italic
        /^_.*_/m, // Italic alternative
        /^\[.*\]\(.*\)/m, // Links
        /^!\[.*\]\(.*\)/m, // Images
        /^```[\s\S]*```/m, // Code blocks
        /^`[^`]+`/m, // Inline code
        /^>\s+/m, // Blockquotes
        /^[-*+]\s+/m, // Unordered lists
        /^\d+\.\s+/m, // Ordered lists
        /^---+$/m, // Horizontal rules
        /^\|\s*.+\s*\|/m, // Tables
    ];
    return markdownPatterns.some((pattern) => pattern.test(text));
}
