import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const bostader = await prisma.bostad.findMany({
      include: {
        rum: {
          include: {
            bokningar: {
              where: { status: { not: "avbokad" } },
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
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const body = await request.json();
  const {
    namn, adress, stadsdel, beskrivning, bilder, delade_utrymmen, inkluderat,
    kontaktperson_namn, kontaktperson_bild, kontaktperson_email, kontaktperson_telefon,
  } = body;

  if (!namn) {
    return Response.json({ error: "Namn krävs" }, { status: 400 });
  }

  const bostad = await prisma.bostad.create({
    data: {
      namn,
      adress: adress ?? null,
      stadsdel: stadsdel ?? null,
      beskrivning: beskrivning ?? null,
      bilder: Array.isArray(bilder) ? bilder : [],
      delade_utrymmen: Array.isArray(delade_utrymmen) ? delade_utrymmen : [],
      inkluderat: Array.isArray(inkluderat) ? inkluderat : [],
      kontaktperson_namn: kontaktperson_namn ?? null,
      kontaktperson_bild: kontaktperson_bild ?? null,
      kontaktperson_email: kontaktperson_email ?? null,
      kontaktperson_telefon: kontaktperson_telefon ?? null,
    },
  });

  return Response.json(bostad, { status: 201 });
}
