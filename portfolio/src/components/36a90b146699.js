import { lexicalEditor, BlocksFeature, CodeBlock, } from '@payloadcms/richtext-lexical';
import { MarkdownPasteFeature } from '@/components/c8060aaafa29';
/**
 * Configured Lexical editor with all features including:
 * - Code blocks with syntax highlighting
 * - Markdown paste auto-conversion
 * - All standard formatting options
 */
export function configuredLexicalEditor() {
    return lexicalEditor({
        features: ({ defaultFeatures }) => [
            ...defaultFeatures,
            // Add code block support with common languages
            BlocksFeature({
                blocks: [
                    CodeBlock({
                        defaultLanguage: 'typescript',
                        languages: {
                            typescript: 'TypeScript',
                            javascript: 'JavaScript',
                            tsx: 'TSX',
                            jsx: 'JSX',
                            python: 'Python',
                            java: 'Java',
                            csharp: 'C#',
                            cpp: 'C++',
                            c: 'C',
                            go: 'Go',
                            rust: 'Rust',
                            php: 'PHP',
                            ruby: 'Ruby',
                            swift: 'Swift',
                            kotlin: 'Kotlin',
                            scala: 'Scala',
                            html: 'HTML',
                            css: 'CSS',
                            scss: 'SCSS',
                            sass: 'Sass',
                            less: 'Less',
                            json: 'JSON',
                            yaml: 'YAML',
                            xml: 'XML',
                            sql: 'SQL',
                            graphql: 'GraphQL',
                            bash: 'Bash',
                            shell: 'Shell',
                            powershell: 'PowerShell',
                            dockerfile: 'Dockerfile',
                            markdown: 'Markdown',
                            plaintext: 'Plain Text',
                        },
                    }),
                ],
            }),
            // Add markdown paste auto-conversion
            MarkdownPasteFeature(),
        ],
    });
}
