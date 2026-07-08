import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { lasJson, validera, bytLosenordSchema } from "@/lib/validering";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const json = await lasJson(request);
    if (!json.ok) return json.svar;

    const valid = validera(bytLosenordSchema, json.body);
    if (!valid.ok) return valid.svar;

    const { nuvarandeLosenord, nyttLosenord } = valid.data;

    const anvandare = await prisma.anvandare.findUnique({
      where: { email: session.email },
    });
    if (!anvandare) {
      return Response.json({ error: "Användare hittades inte" }, { status: 404 });
    }

    const match = await bcrypt.compare(nuvarandeLosenord, anvandare.losenord);
    if (!match) {
      return Response.json(
        { error: "Nuvarande lösenord är felaktigt" },
        { status: 400 }
      );
    }

    const nyHash = await bcrypt.hash(nyttLosenord, 10);
    await prisma.anvandare.update({
      where: { id: anvandare.id },
      data: { losenord: nyHash },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
