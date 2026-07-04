import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bostad = await prisma.bostad.findUnique({
      where: { id },
      include: {
        rum: {
          include: {
            // Publikt endpoint: bara bekräftade bokningar, inga kunduppgifter
            bokningar: {
              where: { status: "bekraftad" },
              select: { id: true, startdatum: true, slutdatum: true, status: true },
              orderBy: { startdatum: "asc" },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!bostad) {
      return Response.json({ error: "Bostad hittades inte" }, { status: 404 });
    }

    return Response.json(bostad);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
