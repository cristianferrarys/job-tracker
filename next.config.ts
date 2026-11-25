import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Loaded with Node's require on the server instead of being bundled: the Gemini SDK and its
  // auth/websocket dependencies are large and server-only, so bundling them only slows compiles.
  serverExternalPackages: ["@google/genai"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
