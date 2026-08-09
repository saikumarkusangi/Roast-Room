import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack rooted on this app (avoids the empty parent lockfile).
    root: path.join(__dirname),
  },
};

export default nextConfig;
