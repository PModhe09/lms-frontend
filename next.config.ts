import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  // The browser only talks to this origin. /api/* is forwarded to Express, so the
  // session cookie is first-party and no CORS is needed. See backend ADR 0001.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
