import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const stoppad = rateLimit(request, "registrera", { max: 5, fonsterMs: 15 * 60 * 1000 });
  if (stoppad) return stoppad;

  try {
    const body = await request.json();
    const { namn, email, losenord } = body;

    if (typeof namn !== "string" || typeof email !== "string" || !namn || !email || !losenord) {
      return Response.json({ error: "Namn, e-post och lösenord krävs" }, { status: 400 });
    }

    if (typeof losenord !== "string" || losenord.length < 8) {
      return Response.json(
        { error: "Lösenordet måste vara minst 8 tecken" },
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
        // Roll får aldrig komma från klienten — admins sätts manuellt i databasen
        roll: "hyresgast",
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
