/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default nextConfig
