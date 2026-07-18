import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Kontrakt är PDF:er — inte bilder — och får aldrig optimeras/konverteras.
// Därför en egen route istället för /api/upload (som är byggd för bilder).
const MAX_STORLEK = 4 * 1024 * 1024; // 4 MB — under Vercels body-gräns på 4,5 MB

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: "Ogiltig formulärdata" }, { status: 400 });
    }

    const fil = formData.get("file");
    const bokningId = formData.get("bokning_id");

    if (!(fil instanceof File)) {
      return Response.json({ error: "Ingen fil skickad" }, { status: 400 });
    }
    if (typeof bokningId !== "string" || !bokningId) {
      return Response.json({ error: "bokning_id krävs" }, { status: 400 });
    }
    if (fil.type !== "application/pdf") {
      return Response.json({ error: "Endast PDF är tillåtet" }, { status: 400 });
    }
    if (fil.size > MAX_STORLEK) {
      return Response.json({ error: "Filen får max vara 4 MB" }, { status: 400 });
    }

    const bokning = await prisma.bokning.findUnique({
      where: { id: bokningId },
      select: { id: true },
    });
    if (!bokning) {
      return Response.json({ error: "Bokning hittades inte" }, { status: 404 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json(
        { error: "Fillagring är inte konfigurerad (BLOB_READ_WRITE_TOKEN saknas)" },
        { status: 500 }
      );
    }

    const { put } = await import("@vercel/blob");
    const filnamn = `kontrakt/${bokningId}-${Date.now()}.pdf`;
    const blob = await put(filnamn, Buffer.from(await fil.arrayBuffer()), {
      access: "public",
      contentType: "application/pdf",
      // Slumpat suffix i URL:en så adressen inte går att gissa —
      // kontrakt innehåller persondata
      addRandomSuffix: true,
    });

    const uppdaterad = await prisma.bokning.update({
      where: { id: bokningId },
      data: {
        kontrakt_url: blob.url,
        kontrakt_status: "uppladdat",
        kontrakt_uppdaterad: new Date(),
      },
      select: {
        id: true,
        kontrakt_url: true,
        kontrakt_status: true,
        kontrakt_uppdaterad: true,
      },
    });

    return Response.json(uppdaterad);
  } catch (err) {
    console.error("[kontrakt] Uppladdningsfel:", err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
