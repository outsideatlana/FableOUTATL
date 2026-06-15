/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow images served from Supabase Storage public buckets.
    // The hostname is read from the public Supabase URL when present.
    remotePatterns: [
      {
        // Vercel Blob public store (event hero images, recap photos).
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        // Legacy: any images still served from Supabase Storage.
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
