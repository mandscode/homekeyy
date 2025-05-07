import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  matcher: ['/dashboard/:path*', '/auth/:path*'],
  images: {
    domains: ['picsum.photos', 'ca-bucket-s3.s3.ap-south-1.amazonaws.com'],
  },
};

export default nextConfig;
