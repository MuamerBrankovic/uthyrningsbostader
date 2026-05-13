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
            bokningar: {
              where: { status: { not: "avbokad" } },
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
