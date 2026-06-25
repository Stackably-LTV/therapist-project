import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { payloadCloudPlugin } from '@payloadcms/payload-cloud';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { Users } from '@/components/59be85cd05bc';
import { Media } from '@/components/2227108e1a70';
import { Posts } from '@/components/ef8e920cf7c5';
import { Analytics } from '@/components/a291b1778926';
import { configuredLexicalEditor } from '@/components/36a90b146699';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
        components: {
            beforeDashboard: ['@/components/8110f9a123d3#default'],
        },
    },
    collections: [Posts, Media, Analytics, Users],
    globals: [],
    editor: configuredLexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || '',
    db: mongooseAdapter({
        url: process.env.MONGODB_URI || '',
    }),
    sharp,
    plugins: [
        payloadCloudPlugin(),
        s3Storage({
            collections: {
                media: true,
            },
            bucket: (process.env.S3_BUCKET || '').trim(),
            config: {
                credentials: {
                    accessKeyId: (process.env.S3_ACCESS_KEY_ID || '').trim(),
                    secretAccessKey: (process.env.S3_SECRET_ACCESS_KEY || '').trim(),
                },
                region: process.env.S3_REGION?.trim(),
                endpoint: process.env.S3_ENDPOINT?.trim(),
                forcePathStyle: true, // Required for MinIO
            },
        }),
        seoPlugin({
            collections: ['posts'],
            uploadsCollection: 'media',
            generateTitle: ({ doc }) => {
                return doc?.title ? `${doc.title} | ${process.env.SITE_NAME || 'Blog'}` : '';
            },
            generateDescription: ({ doc }) => {
                return doc?.excerpt || '';
            },
            generateURL: ({ doc }) => {
                if (doc?.slug) {
                    return `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/blog/${doc.slug}`;
                }
                return '';
            },
        }),
    ],
});
