import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["172.20.10.*"],   
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
