import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { lasJson, validera, hyresvardSchema } from "@/lib/validering";
import { skickaHyresvardsnotisMail } from "@/lib/email";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const anmalningar = await prisma.hyresvardsanmalan.findMany({
    orderBy: { created_at: "desc" },
  });
  return Response.json(anmalningar);
}

export async function POST(request: Request) {
  const stoppad = rateLimit(request, "hyresvardar", { max: 5, fonsterMs: 10 * 60 * 1000 });
  if (stoppad) return stoppad;

  try {
    const json = await lasJson(request);
    if (!json.ok) return json.svar;

    const valid = validera(hyresvardSchema, json.body);
    if (!valid.ok) return valid.svar;

    const { namn, telefon, email, stad, adress, meddelande } = valid.data;

    const anmalan = await prisma.hyresvardsanmalan.create({
      data: {
        namn,
        telefon: telefon ?? null,
        email,
        stad: stad ?? null,
        adress: adress ?? null,
        meddelande: meddelande ?? null,
      },
    });

    // Adminnotis — awaitas så Vercel inte river funktionen innan mejlet
    // skickats; .catch bevarar fail-safe: ett mejlfel blockerar inte att anmälan sparats.
    await skickaHyresvardsnotisMail(anmalan).catch((err) =>
      console.error("[email] Uncaught hyresvärdsnotis-fel:", err)
    );

    // Vitlistat svar — interna fält (status, intern_notering) får aldrig
    // lämna servern på detta publika endpoint
    return Response.json({ ok: true, id: anmalan.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
