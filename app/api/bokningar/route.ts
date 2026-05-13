import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
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

    const rum = await prisma.rum.findUnique({
      where: { id: rum_id },
      include: {
        bokningar: { where: { status: { not: "avbokad" } } },
      },
    });

    if (!rum) {
      return Response.json({ error: "Rum hittades inte" }, { status: 404 });
    }

    const forstaLediga = getForstaLedigaDatum(rum);
    if (startDate < forstaLediga) {
      const formatted = forstaLediga.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return Response.json(
        { error: `Startdatum måste vara från och med ${formatted}` },
        { status: 400 }
      );
    }

    const bokning = await prisma.bokning.create({
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
