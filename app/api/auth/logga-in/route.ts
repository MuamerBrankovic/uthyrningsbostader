import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, losenord } = body;

    if (!email || !losenord) {
      return Response.json({ error: "E-post och lösenord krävs" }, { status: 400 });
    }

    const user = await prisma.anvandare.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "Fel e-post eller lösenord" }, { status: 401 });
    }

    const match = await bcrypt.compare(losenord, user.losenord);
    if (!match) {
      return Response.json({ error: "Fel e-post eller lösenord" }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      email: user.email,
      namn: user.namn,
      roll: user.roll,
    });

    return Response.json({ id: user.id, email: user.email, namn: user.namn, roll: user.roll });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
