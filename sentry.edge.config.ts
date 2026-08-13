// Startar Sentry för EDGE-runtimen. Hos oss körs bara opengraph-image och
// twitter-image där (de har `export const runtime = "edge"`).
// Laddas av instrumentation.ts. Samma inställningar som servern.
import * as Sentry from "@sentry/nextjs";
import { gemensammaInstallningar } from "@/lib/sentry-installningar";

Sentry.init(gemensammaInstallningar());
