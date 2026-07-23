import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { lasJson, validera, offertPatchSchema } from "@/lib/validering";

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

    const valid = validera(offertPatchSchema, json.body);
    if (!valid.ok) return valid.svar;

    const data: { status?: string; intern_notering?: string | null; uppdaterad: Date } = {
      uppdaterad: new Date(),
    };
    if (valid.data.status !== undefined) data.status = valid.data.status;
    if (valid.data.intern_notering !== undefined) {
      // Tom/blank anteckning lagras som null
      const n = valid.data.intern_notering?.trim();
      data.intern_notering = n ? n : null;
    }

    const befintlig = await prisma.offertforfragan.findUnique({ where: { id }, select: { id: true } });
    if (!befintlig) {
      return Response.json({ error: "Offertförfrågan hittades inte" }, { status: 404 });
    }

    const offert = await prisma.offertforfragan.update({ where: { id }, data });
    return Response.json(offert);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
