import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Live-listing photos come from the Homedata feed — see RemotePhoto in
      // src/components/ui/Photo.tsx.
      { protocol: "https", hostname: "api.homedata.co.uk" },
      // User-uploaded listing photos, stored in Vercel Blob — see
      // src/lib/upload.ts.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  /**
   * The routes moved when the app was reorganised. These keep old links —
   * shared property pages, bookmarks — working. Permanent, because the new
   * paths are the canonical ones.
   */
  async redirects() {
    return [
      { source: "/login", destination: "/auth/login", permanent: true },
      { source: "/register", destination: "/auth/register", permanent: true },
      {
        source: "/forgot-password",
        destination: "/auth/forgot-password",
        permanent: true,
      },
      { source: "/search", destination: "/properties", permanent: true },
      {
        source: "/property/:propertyId",
        destination: "/properties/:propertyId",
        permanent: true,
      },
      {
        source: "/account/properties",
        destination: "/account/my-properties",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
