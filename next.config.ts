import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.16"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
    ],
  },
};

// ─── Sentry ──────────────────────────────────────────────────────────────────
// withSentryConfig kopplar in Sentry i bygget. Inställningarna för VAD som
// rapporteras ligger i lib/sentry-installningar.ts — här handlar det bara om
// hur bygget ska bete sig.
export default withSentryConfig(nextConfig, {
  // Ingen uppladdning av source maps. Det kräver en SENTRY_AUTH_TOKEN som vi
  // inte har satt, och utan den skulle bygget klaga vid varje körning.
  // Följden: stacktraces i Sentry pekar på den minifierade koden. Vill ni ha
  // läsbara radnummer senare — skapa en auth token i Sentry, lägg den som
  // SENTRY_AUTH_TOKEN i Vercel och sätt disable: false här.
  sourcemaps: { disable: true },

  // Tystar Sentrys egna byggloggar så `npm run build` ser ut som förut.
  silent: true,

  // Skicka ingen användningsstatistik om själva bygget till Sentry.
  telemetry: false,

  // OBS: Sentrys bundle-bantning (treeshake.removeTracing / removeDebugLogging)
  // ligger under `webpack` och fungerar INTE med Turbopack, som vi kör.
  // Därför är de inte satta här — de hade bara gett varningar utan effekt.
});
