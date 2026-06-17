import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bytesmedical.portfolio",
  appName: "Byte Portfolio",
  // The static Next.js export (npm run build:static) lands here and is bundled
  // into the native app. The UI runs offline; AI calls go to the Render backend
  // via NEXT_PUBLIC_API_BASE_URL baked into the bundle.
  webDir: "out",
  server: {
    // Serve over https so the WebView is a secure context (required for the
    // microphone / getUserMedia used by voice capture).
    androidScheme: "https",
  },
  plugins: {
    // Route fetch()/XHR through the native HTTP stack. This bypasses browser
    // CORS, so the bundled app can call the Render backend cross-origin without
    // any CORS config on the API routes. (WebSocket voice streaming is separate
    // and unaffected.)
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
