import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  eslint: {
    ignoreDuringBuilds: true,
  },
  // output: 'standalone', // Disabled - doesn't work with Payload CMS dynamic dependencies
  serverExternalPackages: ['@payloadcms/payload-cloud'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images
      },
    ],
    // Allow local API routes for media
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (webpackConfig, { isServer }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Fix Lexical bundling issue - ensure singleton instances
    // Only apply client-side optimizations that don't break Payload UI
    if (!isServer) {
      // Bundle all Lexical packages together in a single chunk
      // This prevents multiple instances without interfering with Payload's bundling
      if (!webpackConfig.optimization) {
        webpackConfig.optimization = {}
      }

      const existingCacheGroups = webpackConfig.optimization.splitChunks?.cacheGroups || {}

      webpackConfig.optimization.splitChunks = {
        ...webpackConfig.optimization.splitChunks,
        cacheGroups: {
          ...existingCacheGroups,
          // Bundle all Lexical packages together to prevent duplicate instances
          lexical: {
            test: /[\\/]node_modules[\\/](lexical|@lexical)[\\/]/,
            name: 'lexical',
            chunks: 'all',
            enforce: true,
            priority: 20,
          },
        },
      }
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
