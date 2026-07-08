import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { lasJson, validera, bostadSchema } from "@/lib/validering";

export async function GET() {
  try {
    const bostader = await prisma.bostad.findMany({
      include: {
        rum: {
          include: {
            // Publikt endpoint: bara bekräftade bokningar påverkar tillgänglighet,
            // och kunduppgifter (namn/email/telefon) får aldrig läcka ut här
            bokningar: {
              where: { status: "bekraftad" },
              select: { id: true, startdatum: true, slutdatum: true, status: true },
              orderBy: { startdatum: "desc" },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return Response.json(bostader);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const json = await lasJson(request);
    if (!json.ok) return json.svar;

    const valid = validera(bostadSchema, json.body);
    if (!valid.ok) return valid.svar;

    const {
      namn, adress, stadsdel, bostadstyp, beskrivning, bilder, delade_utrymmen, inkluderat,
      kontaktperson_namn, kontaktperson_bild, kontaktperson_email, kontaktperson_telefon,
    } = valid.data;

    const bostad = await prisma.bostad.create({
      data: {
        namn,
        adress: adress ?? null,
        stadsdel: stadsdel ?? null,
        bostadstyp: bostadstyp ?? "privat_rum",
        beskrivning: beskrivning ?? null,
        bilder: bilder ?? [],
        delade_utrymmen: delade_utrymmen ?? [],
        inkluderat: inkluderat ?? [],
        kontaktperson_namn: kontaktperson_namn ?? null,
        kontaktperson_bild: kontaktperson_bild ?? null,
        kontaktperson_email: kontaktperson_email ?? null,
        kontaktperson_telefon: kontaktperson_telefon ?? null,
      },
    });

    return Response.json(bostad, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
