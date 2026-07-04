import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const TILLATNA_STATUS = ["forfragan", "bekraftad", "avbokad"] as const;
type BokningStatus = (typeof TILLATNA_STATUS)[number];

type Body = {
  status?: string;
  slutdatum?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    let body: Body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Ogiltig JSON" }, { status: 400 });
    }

    const data: { status?: BokningStatus; slutdatum?: Date | null } = {};

    if (body.status !== undefined) {
      if (!TILLATNA_STATUS.includes(body.status as BokningStatus)) {
        return Response.json(
          { error: `status måste vara en av: ${TILLATNA_STATUS.join(", ")}` },
          { status: 400 }
        );
      }
      data.status = body.status as BokningStatus;
    }

    if (body.slutdatum !== undefined) {
      if (body.slutdatum === null || body.slutdatum === "") {
        data.slutdatum = null;
      } else {
        const d = new Date(body.slutdatum);
        if (isNaN(d.getTime())) {
          return Response.json({ error: "Ogiltigt slutdatum" }, { status: 400 });
        }
        data.slutdatum = d;
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json(
        { error: "Ange status och/eller slutdatum" },
        { status: 400 }
      );
    }

    const befintlig = await prisma.bokning.findUnique({ where: { id } });
    if (!befintlig) {
      return Response.json({ error: "Bokning hittades inte" }, { status: 404 });
    }

    if (data.slutdatum && data.slutdatum <= befintlig.startdatum) {
      return Response.json(
        { error: "Slutdatum måste vara efter startdatum" },
        { status: 400 }
      );
    }

    const bokning = await prisma.bokning.update({
      where: { id },
      data,
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
    });

    return Response.json(bokning);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
