import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const body = await request.json();
    const { bostad_id, namn, beskrivning, bilder, kvm, manadshyra, moblering } = body;

    if (!bostad_id || !namn || manadshyra == null) {
      return Response.json({ error: "bostad_id, namn och manadshyra krävs" }, { status: 400 });
    }

    const rum = await prisma.rum.create({
      data: {
        bostad_id,
        namn,
        beskrivning: beskrivning ?? null,
        bilder: Array.isArray(bilder) ? bilder : [],
        kvm: kvm ? Number(kvm) : null,
        manadshyra: Number(manadshyra),
        moblering: Array.isArray(moblering) ? moblering : [],
      },
    });

    return Response.json(rum, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
