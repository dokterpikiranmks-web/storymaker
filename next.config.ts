import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Native / wasm-heavy renderers must stay outside the server bundle so they can
  // resolve their own binaries (resvg .node, satori's harfbuzz/yoga wasm) from node_modules.
  serverExternalPackages: ["@resvg/resvg-js", "satori", "harfbuzzjs"],
  // Fonts + wasm are read from disk at runtime — make sure they ship with serverless functions.
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/assets/fonts/**/*", "./node_modules/harfbuzzjs/*.wasm", "./node_modules/satori/*.wasm"],
    "/dashboard": ["./src/assets/fonts/**/*", "./node_modules/harfbuzzjs/*.wasm", "./node_modules/satori/*.wasm"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
