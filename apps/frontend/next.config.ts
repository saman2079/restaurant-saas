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
  allowedDevOrigins: ["172.20.10.*"], // ✅ array


  typescript: {
    // این خط باعث می‌شود که در هنگام build، تایپ‌اسکریپت نادیده گرفته شود
    // و اجازه دهد پروژه حتی با وجود ارورهای تایپی ساخته شود.
    ignoreBuildErrors: true,
  },

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
