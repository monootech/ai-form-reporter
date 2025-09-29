/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  // Remove the 'api' section as it's not valid in Next.js config
}

export default nextConfig;
