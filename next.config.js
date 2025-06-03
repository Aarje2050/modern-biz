// next.config.js (UPDATED - MORE COMPREHENSIVE FIX)
/** @type {import('next').NextConfig} */
const nextConfig = {

  async redirects() {
    return [
      // Redirect old WordPress listings to new businesses URLs
      {
        source: '/listings/:slug*',
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
  images: {
    domains: [
      'krmmxfmvssmzcmbitvil.supabase.co', 
      'ductcleaningca.com',
      'www.ductcleaningca.com'  // Add this line
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