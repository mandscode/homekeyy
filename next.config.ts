import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  matcher: ['/dashboard/:path*', '/auth/:path*'],
  images: {
    domains: ['picsum.photos'],
  },
};

export default nextConfig;
