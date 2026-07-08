import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { lasJson, validera, registreraSchema } from "@/lib/validering";

export async function POST(request: Request) {
  const stoppad = rateLimit(request, "registrera", { max: 5, fonsterMs: 15 * 60 * 1000 });
  if (stoppad) return stoppad;

  try {
    const json = await lasJson(request);
    if (!json.ok) return json.svar;

    const valid = validera(registreraSchema, json.body);
    if (!valid.ok) return valid.svar;

    const { namn, email, losenord } = valid.data;

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
