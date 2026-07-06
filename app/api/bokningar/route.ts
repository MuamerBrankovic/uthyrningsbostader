import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { skickaBokningsmail } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";
import { ApiFel } from "@/lib/apifel";

export async function GET(request: Request) {
  try {
    // ?alla=1 — admin hämtar samtliga bokningar (för dashboard-fliken)
    const alla = new URL(request.url).searchParams.get("alla") === "1";
    if (alla) {
      const auth = await requireAdmin();
      if (!auth.ok) {
        return Response.json({ error: auth.error }, { status: auth.status });
      }
      const bokningar = await prisma.bokning.findMany({
        include: {
          rum: {
            select: {
              id: true,
              namn: true,
              manadshyra: true,
              bostad: { select: { id: true, namn: true, stadsdel: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      return Response.json(bokningar);
    }

    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const bokningar = await prisma.bokning.findMany({
      where: { email: session.email },
      include: {
        rum: {
          include: { bostad: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return Response.json(bokningar);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}

type BokningBody = {
  rum_id: string;
  kund_foretag?: string;
  kund_orgnr?: string;
  kund_kontaktperson: string;
  boende_namn?: string;
  email: string;
  telefon?: string;
  startdatum: string;
  avtalstyp?: string;
};

export async function POST(request: Request) {
  const stoppad = rateLimit(request, "bokningar", { max: 5, fonsterMs: 10 * 60 * 1000 });
  if (stoppad) return stoppad;

  try {
    const body: BokningBody = await request.json();
    const {
      rum_id,
      kund_foretag,
      kund_orgnr,
      kund_kontaktperson,
      boende_namn,
      email,
      telefon,
      startdatum,
      avtalstyp,
    } = body;

    if (!rum_id || !kund_kontaktperson || !email || !startdatum) {
      return Response.json(
        { error: "rum_id, kund_kontaktperson, email och startdatum krävs" },
        { status: 400 }
      );
    }

    const startDate = new Date(startdatum);
    if (isNaN(startDate.getTime())) {
      return Response.json({ error: "Ogiltigt startdatum" }, { status: 400 });
    }

    const maxFramtid = new Date();
    maxFramtid.setMonth(maxFramtid.getMonth() + 24);
    if (startDate > maxFramtid) {
      return Response.json(
        { error: "Startdatum kan vara högst 24 månader fram i tiden" },
        { status: 400 }
      );
    }

    // Tillgänglighetskontroll + skapande sker atomärt (Serializable) så att
    // två samtidiga anrop inte kan smyga förbi varandras kontroller
    let resultat: {
      bokning: Awaited<ReturnType<typeof prisma.bokning.create>>;
      rum: { namn: string; manadshyra: number; bostad: { namn: string; stadsdel: string | null; adress: string | null } };
    };
    try {
      resultat = await prisma.$transaction(
        async (tx) => {
          const rum = await tx.rum.findUnique({
            where: { id: rum_id },
            include: {
              bostad: { select: { namn: true, stadsdel: true, adress: true } },
              // Endast bekräftade bokningar blockerar — en obekräftad förfrågan
              // får inte låsa rummet för andra
              bokningar: { where: { status: "bekraftad" } },
            },
          });

          if (!rum) throw new ApiFel(404, "Rum hittades inte");

          const forstaLediga = getForstaLedigaDatum(rum);
          if (startDate < forstaLediga) {
            const formatted = forstaLediga.toLocaleDateString("sv-SE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            throw new ApiFel(400, `Startdatum måste vara från och med ${formatted}`);
          }

          const bokning = await tx.bokning.create({
            data: {
              rum_id,
              kund_foretag: kund_foretag ?? null,
              kund_orgnr: kund_orgnr ?? null,
              kund_kontaktperson,
              boende_namn: boende_namn ?? null,
              email,
              telefon: telefon ?? null,
              startdatum: startDate,
              avtalstyp: avtalstyp ?? "standard",
            },
          });

          return { bokning, rum };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof ApiFel) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      // P2034 = serialiseringskonflikt: ett samtidigt anrop hann före
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
        return Response.json(
          { error: "Rummet är inte längre tillgängligt för valt datum. Försök igen." },
          { status: 409 }
        );
      }
      throw err;
    }

    const { bokning, rum } = resultat;

    // Bekräftelsemail — får ALDRIG blockera success-svaret
    skickaBokningsmail(
      bokning,
      { namn: rum.namn, manadshyra: rum.manadshyra },
      rum.bostad
    ).catch((err) => console.error("[email] Uncaught bokningsmail-fel:", err));

    return Response.json(bokning, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}

type RumWithBokningar = {
  status: string;
  bokningar: { slutdatum: Date | null; startdatum: Date }[];
};

function getForstaLedigaDatum(rum: RumWithBokningar): Date {
  const active = rum.bokningar;

  if (active.length === 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 10);
    return far;
  }

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  latest.setDate(latest.getDate() + 1);
  latest.setHours(0, 0, 0, 0);
  return latest;
}
