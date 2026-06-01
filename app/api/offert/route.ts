import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { skickaOffertmail } from "@/lib/email";

type OffertBody = {
  foretag: string;
  orgnr?: string;
  kontaktperson: string;
  email: string;
  telefon: string;
  stad: string;
  antal_personer?: number | string;
  inflyttning?: string;
  bostadstyp?: string;
  meddelande?: string;
};

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
  try {
    const body: OffertBody = await request.json();
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
    } = body;

    if (!foretag || !kontaktperson || !email || !telefon || !stad) {
      return Response.json(
        { error: "foretag, kontaktperson, email, telefon och stad krävs" },
        { status: 400 }
      );
    }

    let inflyttningDate: Date | null = null;
    if (inflyttning) {
      const d = new Date(inflyttning);
      if (!isNaN(d.getTime())) inflyttningDate = d;
    }

    let antalPersoner: number | null = null;
    if (antal_personer != null && antal_personer !== "") {
      const n = Number(antal_personer);
      if (Number.isFinite(n) && n > 0) antalPersoner = Math.floor(n);
    }

    const offert = await prisma.offertforfragan.create({
      data: {
        foretag,
        orgnr: orgnr ?? null,
        kontaktperson,
        email,
        telefon,
        stad,
        antal_personer: antalPersoner,
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
