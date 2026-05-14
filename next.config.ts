import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node addon; never try to bundle it.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
