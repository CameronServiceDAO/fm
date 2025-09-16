/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    domains: [
      'resources.premierleague.com',
      'fantasy.premierleague.com',
      'platform-static-files.s3.amazonaws.com',
    ],
  },

  webpack: (config, { isServer }) => {
    // Fix for wagmi/viem BigInt serialization
    if (!isServer) {
      config.resolve.fallback = { 
        fs: false,
        net: false,
        tls: false 
      };
    }
    return config;
  },

  // Transpile packages that need it
  transpilePackages: ['@rainbow-me/rainbowkit'],
};

export default nextConfig;
