import { requireAdmin } from "@/lib/auth";
import { rapporteraFel } from "@/lib/sentry-rapportera";
import { SENTRY_AKTIVT } from "@/lib/sentry-installningar";

// ═══════════════════════════════════════════════════════════════════════════
// TILLFÄLLIG TESTROUTE FÖR SENTRY — TA BORT NÄR DU VERIFIERAT
//
// Används en gång efter deploy för att bekräfta att fel verkligen når Sentry.
// Ta sedan bort hela mappen app/api/sentry-test/.
//
// KRÄVER ADMIN-INLOGGNING. Det är med flit: en öppen route som kastar fel
// skulle kunna spammas av vem som helst och bränna hela månadskvoten
// (5 000 fel) på några minuter.
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const typ = new URL(request.url).searchParams.get("typ");

  // ?typ=kastat — härmar ett fel som ingen fångat (t.ex. en trasig databas-
  // fråga). Ska dyka upp i Sentry via instrumentation.ts.
  if (typ === "kastat") {
    throw new Error("[Sentry-test] Kastat testfel från /api/sentry-test");
  }

  // ?typ=rapporterat — härmar ett fel som koden fångar själv (t.ex. ett nekat
  // mejlutskick). Ska dyka upp i Sentry via rapporteraFel().
  if (typ === "rapporterat") {
    rapporteraFel(
      new Error("[Sentry-test] Rapporterat testfel från /api/sentry-test"),
      "sentry-test.rapporterat",
      { kalla: "manuell verifiering" }
    );
    return Response.json({ skickat: "rapporterat", sentry_aktivt: SENTRY_AKTIVT });
  }

  // Utan ?typ visas bara diagnostik — inget fel skickas.
  // Observera: bara OM en DSN finns, aldrig vilken.
  return Response.json({
    sentry_aktivt: SENTRY_AKTIVT,
    dsn_finns: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    node_env: process.env.NODE_ENV,
    miljo: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "(lokal)",
    hjalp: "Lägg till ?typ=kastat eller ?typ=rapporterat för att skicka ett testfel",
  });
}
