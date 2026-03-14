/** @type {import('next').NextConfig} */
const nextConfig = {
    // Removed 'output: export' to enable middleware and API routes
    // This requires a Node.js server (Vercel, Netlify, or self-hosted)
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig
