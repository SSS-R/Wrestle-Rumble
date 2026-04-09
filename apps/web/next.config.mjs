/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    distDir: 'dist',
    images: {
        unoptimized: true,
    },
    basePath: '/Wrestle-Rumble',
};

export default nextConfig;
