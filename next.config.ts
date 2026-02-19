import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["geist"],
  images: {
    loader: "custom",
    loaderFile: "./src/lib/supabase-image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
    ],
  },
};

export default nextConfig;
