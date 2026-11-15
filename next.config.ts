import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    output:              'standalone',
    poweredByHeader:     false,
    reactStrictMode:     true,
    images:              {
        unoptimized: true,
    },
    serverExternalPackages: [
        '@react-pdf/renderer',
        'nodemailer',
        'mysql2',
        'pg',
    ],
    typescript:          {
        // type checking runs separately via `npm run typecheck` (TypeScript 7)
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
