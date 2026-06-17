import type { NextConfig } from "next";

// Two build modes from one codebase:
//  • default (server)  → for Render: keeps the /api routes that hold the keys.
//  • BUILD_TARGET=static → for Capacitor: emits a static `out/` SPA to bundle
//    into the native app (no server, so API calls go to NEXT_PUBLIC_API_BASE_URL).
const isStatic = process.env.BUILD_TARGET === "static";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the dev-mode overlay badge (it floats over the bottom tab bar).
  devIndicators: false,
  ...(isStatic
    ? {
        output: "export",
        images: { unoptimized: true },
        // Emit /route/index.html so the WebView resolves paths from the file bundle.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
