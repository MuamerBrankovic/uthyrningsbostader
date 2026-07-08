import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { lasJson, validera, rumSchema } from "@/lib/validering";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const json = await lasJson(request);
    if (!json.ok) return json.svar;

    const valid = validera(rumSchema, json.body);
    if (!valid.ok) return valid.svar;

    const { bostad_id, namn, beskrivning, bilder, kvm, manadshyra, moblering } = valid.data;

    const rum = await prisma.rum.create({
      data: {
        bostad_id,
        namn,
        beskrivning: beskrivning ?? null,
        bilder: bilder ?? [],
        kvm: kvm ?? null,
        manadshyra,
        moblering: moblering ?? [],
      },
    });

    return Response.json(rum, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
