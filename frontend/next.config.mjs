/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // Configure image domains for Next.js Image component
  images: {
    domains: [
      'resources.premierleague.com', // FPL player images
      'fantasy.premierleague.com',    // FPL assets
      'platform-static-files.s3.amazonaws.com', // FPL static files
    ],
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', // Sepolia by default
  },

  // Webpack configuration
  webpack: (config) => {
    // Fix for wagmi/viem BigInt serialization
    config.resolve.fallback = { 
      fs: false,
      net: false,
      tls: false 
    };
    
    // Handle .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },

  // API route configuration
  async rewrites() {
    return [
      {
        // Proxy FPL API calls to avoid CORS issues
        source: '/fpl-proxy/:path*',
        destination: 'https://fantasy.premierleague.com/api/:path*',
      },
    ];
  },

  // Headers configuration for CORS
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Suppress hydration warnings in development
  suppressHydrationWarning: true,

  // Experimental features
  experimental: {
    // Enable server actions if needed
    serverActions: {
      enabled: true,
    },
  },

  // TypeScript configuration
  typescript: {
    // Set to true to ignore TypeScript errors during build (not recommended for production)
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Set to true to ignore ESLint errors during build
    ignoreDuringBuilds: false,
  },

  // Output configuration for deployment
  output: 'standalone',
};

export default nextConfig;

