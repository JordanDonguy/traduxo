import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true
  },
  // Native-binary packages must stay as Node CommonJS at runtime — Turbopack
  // otherwise mangles their module IDs in the production build.
  serverExternalPackages: ["bcrypt", "@prisma/client", ".prisma/client"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
