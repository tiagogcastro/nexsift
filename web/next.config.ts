import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const staticContent = process.env.CONTENT_SOURCE !== 's3'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!staticContent) {
      return { beforeFiles: [], afterFiles: [], fallback: [] }
    }

    // Static mode serves the snapshot images from public/images while posts
    // keep their /s3/public/images/... references unchanged.
    return {
      beforeFiles: [
        { source: '/s3/public/images/:path*', destination: '/images/:path*' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default withNextIntl(nextConfig)
