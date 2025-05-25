// next.config.js (UPDATED - MORE COMPREHENSIVE FIX)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['krmmxfmvssmzcmbitvil.supabase.co', 'ductcleaningca.com'],
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