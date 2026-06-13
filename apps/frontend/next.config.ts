import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "http",
  //       hostname: "localhost",
  //       port: "4000",
  //       pathname: "/uploads/**",
  //     },
  //   ],
  // },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
