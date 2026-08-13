// Next.js kör den här filen EN gång när servern startar (både på Vercel och
// lokalt). Vi använder den för att starta Sentry i rätt runtime, och för att
// fånga fel som Next.js själv upptäcker i server-komponenter och API-routes.
//
// Filen måste ligga i projektets rot för att Next.js ska hitta den.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Fångar fel som bubblar upp ur server-komponenter och route handlers.
// (Fel som koden själv fångar med try/catch syns INTE här — dem rapporterar
// vi explicit med rapporteraFel() i lib/sentry-rapportera.ts.)
export const onRequestError = Sentry.captureRequestError;
