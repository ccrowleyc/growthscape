import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/admin", destination: "/users", permanent: true },
      { source: "/admin/users/:id", destination: "/users/:id", permanent: true },
      { source: "/assessments/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
