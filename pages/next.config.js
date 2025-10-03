/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    PUBLISHER_WORKFLOW_URL: process.env.PUBLISHER_WORKFLOW_URL,
  },
}

module.exports = nextConfig
