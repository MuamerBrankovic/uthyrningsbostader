import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

// Jämförs mot när e-posten inte finns, så att svarstiden inte avslöjar
// vilka adresser som är registrerade
const DUMMY_HASH = "$2b$12$1i0.42uN5z.qkI2tc5O7xu/rk0/DVV1EiJuWLV5B8izeZSfHj5nNG";

export async function POST(request: Request) {
  const stoppad = rateLimit(request, "logga-in", { max: 10, fonsterMs: 15 * 60 * 1000 });
  if (stoppad) return stoppad;

  try {
    const body = await request.json();
    const { email, losenord } = body;

    if (typeof email !== "string" || typeof losenord !== "string" || !email || !losenord) {
      return Response.json({ error: "E-post och lösenord krävs" }, { status: 400 });
    }

    const user = await prisma.anvandare.findUnique({ where: { email } });
    const match = await bcrypt.compare(losenord, user?.losenord ?? DUMMY_HASH);
    if (!user || !match) {
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
