// FILE: my_repo/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    PUBLISHER_WORKFLOW_URL: process.env.PUBLISHER_WORKFLOW_URL,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  }
}

module.exports = nextConfig
