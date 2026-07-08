import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ApiFel } from "@/lib/apifel";
import { lasJson, validera, bokningPatchSchema } from "@/lib/validering";

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

    const json = await lasJson(request);
    if (!json.ok) return json.svar;

    const valid = validera(bokningPatchSchema, json.body);
    if (!valid.ok) return valid.svar;

    const data: { status?: "forfragan" | "bekraftad" | "avbokad"; slutdatum?: Date | null } = {};

    if (valid.data.status !== undefined) {
      data.status = valid.data.status;
    }

    if (valid.data.slutdatum !== undefined) {
      if (valid.data.slutdatum === null || valid.data.slutdatum === "") {
        data.slutdatum = null;
      } else {
        const d = new Date(valid.data.slutdatum);
        if (isNaN(d.getTime())) {
          return Response.json({ error: "Ogiltigt slutdatum" }, { status: 400 });
        }
        data.slutdatum = d;
      }
    }

    // Kontroll + uppdatering sker atomärt (Serializable) så att två admins
    // inte kan bekräfta överlappande bokningar samtidigt
    let bokning;
    try {
      bokning = await prisma.$transaction(
        async (tx) => {
          const befintlig = await tx.bokning.findUnique({ where: { id } });
          if (!befintlig) throw new ApiFel(404, "Bokning hittades inte");

          const nyStatus = data.status ?? befintlig.status;
          const nyttSlutdatum =
            data.slutdatum !== undefined ? data.slutdatum : befintlig.slutdatum;

          if (nyttSlutdatum && nyttSlutdatum <= befintlig.startdatum) {
            throw new ApiFel(400, "Slutdatum måste vara efter startdatum");
          }

          // Dubbelbokningsskydd: rummet får inte ha någon annan bekräftad
          // bokning som överlappar perioden. slutdatum null = tills vidare,
          // dvs. överlappar allt från sitt startdatum och framåt.
          if (nyStatus === "bekraftad") {
            const krock = await tx.bokning.findFirst({
              where: {
                rum_id: befintlig.rum_id,
                id: { not: befintlig.id },
                status: "bekraftad",
                // Befintlig bokning börjar innan/på vår slutpunkt ...
                ...(nyttSlutdatum ? { startdatum: { lte: nyttSlutdatum } } : {}),
                // ... och slutar efter/på vår startpunkt
                OR: [
                  { slutdatum: null },
                  { slutdatum: { gte: befintlig.startdatum } },
                ],
              },
              select: { id: true },
            });
            if (krock) {
              throw new ApiFel(
                409,
                "Rummet har redan en bekräftad bokning som överlappar den här perioden"
              );
            }
          }

          return tx.bokning.update({
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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof ApiFel) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      // P2034 = serialiseringskonflikt: en samtidig ändring hann före
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
        return Response.json(
          { error: "En samtidig ändring hann före. Ladda om listan och försök igen." },
          { status: 409 }
        );
      }
      throw err;
    }

    return Response.json(bokning);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
