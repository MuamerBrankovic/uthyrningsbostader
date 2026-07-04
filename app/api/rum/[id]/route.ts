import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rum = await prisma.rum.findUnique({
      where: { id },
      include: {
        bostad: true,
        // Publikt endpoint: bara bekräftade bokningar, inga kunduppgifter
        bokningar: {
          where: { status: "bekraftad" },
          select: { id: true, startdatum: true, slutdatum: true, status: true },
          orderBy: { startdatum: "asc" },
        },
      },
    });

    if (!rum) {
      return Response.json({ error: "Rum hittades inte" }, { status: 404 });
    }

    return Response.json(rum);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
