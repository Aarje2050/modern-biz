// next.config.js (UPDATED - MORE COMPREHENSIVE FIX)
/** @type {import('next').NextConfig} */
const nextConfig = {

  // Prevent trailing slash redirects
  trailingSlash: false,

  async redirects() {
    return [
      // Redirect old WordPress listings to new businesses URLs
      {
        source: '/listing/:slug*',
        destination: '/businesses/:slug*',
        permanent: true, // 301 redirect for SEO
      },
      // Redirect old WordPress listing categories to new categories URLs
      {
        source: '/listing-category/:slug*',
        destination: '/categories/:slug*',
        permanent: true, // 301 redirect for SEO
      },
    ]
  },
  // Allow external images from WordPress (UPDATED for temp domain)
  images: {
    domains: ['krmmxfmvssmzcmbitvil.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uatbou.serveravatartmp.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Simple fix for WebSocket and browser globals
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig