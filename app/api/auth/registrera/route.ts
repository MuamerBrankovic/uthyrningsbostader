import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namn, email, losenord, roll } = body;

    if (!namn || !email || !losenord) {
      return Response.json({ error: "Namn, e-post och lösenord krävs" }, { status: 400 });
    }

    if (losenord.length < 6) {
      return Response.json(
        { error: "Lösenordet måste vara minst 6 tecken" },
        { status: 400 }
      );
    }

    const existing = await prisma.anvandare.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "E-postadressen är redan registrerad" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(losenord, 12);

    const user = await prisma.anvandare.create({
      data: {
        namn,
        email,
        losenord: hashedPassword,
        roll: roll ?? "hyresgast",
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      namn: user.namn,
      roll: user.roll,
    });

    return Response.json(
      { id: user.id, email: user.email, namn: user.namn, roll: user.roll },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
