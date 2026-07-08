import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { skickaOffertmail } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";
import { lasJson, validera, offertSchema } from "@/lib/validering";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const offerter = await prisma.offertforfragan.findMany({
    orderBy: { created_at: "desc" },
  });
  return Response.json(offerter);
}

export async function POST(request: Request) {
  const stoppad = rateLimit(request, "offert", { max: 5, fonsterMs: 10 * 60 * 1000 });
  if (stoppad) return stoppad;

  try {
    const json = await lasJson(request);
    if (!json.ok) return json.svar;

    const valid = validera(offertSchema, json.body);
    if (!valid.ok) return valid.svar;

    const {
      foretag,
      orgnr,
      kontaktperson,
      email,
      telefon,
      stad,
      antal_personer,
      inflyttning,
      bostadstyp,
      meddelande,
    } = valid.data;

    let inflyttningDate: Date | null = null;
    if (inflyttning) {
      const d = new Date(inflyttning);
      if (!isNaN(d.getTime())) inflyttningDate = d;
    }

    const offert = await prisma.offertforfragan.create({
      data: {
        foretag,
        orgnr: orgnr ?? null,
        kontaktperson,
        email,
        telefon,
        stad,
        antal_personer: antal_personer ?? null,
        inflyttning: inflyttningDate,
        bostadstyp: bostadstyp ?? null,
        meddelande: meddelande ?? null,
      },
    });

    // Mail får ALDRIG blockera sparandet
    skickaOffertmail(offert).catch((err) =>
      console.error("[email] Uncaught offertmail-fel:", err)
    );

    return Response.json(offert, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
