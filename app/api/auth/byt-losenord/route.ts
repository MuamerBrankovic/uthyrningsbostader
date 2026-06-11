import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

const MIN_LANGD = 8;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const body = await request.json();
    const { nuvarandeLosenord, nyttLosenord } = body;

    if (!nuvarandeLosenord || !nyttLosenord) {
      return Response.json(
        { error: "Både nuvarande och nytt lösenord krävs" },
        { status: 400 }
      );
    }

    if (typeof nyttLosenord !== "string" || nyttLosenord.length < MIN_LANGD) {
      return Response.json(
        { error: `Det nya lösenordet måste vara minst ${MIN_LANGD} tecken` },
        { status: 400 }
      );
    }

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
