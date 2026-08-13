// Startar Sentry för SERVERN (Node.js-runtimen) — API-routes, server-
// komponenter och allt annat som körs på Vercel.
// Laddas av instrumentation.ts vid serverstart. Alla inställningar kommer
// från lib/sentry-installningar.ts.
import * as Sentry from "@sentry/nextjs";
import { gemensammaInstallningar } from "@/lib/sentry-installningar";

Sentry.init(gemensammaInstallningar());
