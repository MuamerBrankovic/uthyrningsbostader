import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const anmalningar = await prisma.hyresvardsanmalan.findMany({
    orderBy: { created_at: "desc" },
  });
  return Response.json(anmalningar);
}

type Body = {
  namn: string;
  telefon?: string;
  email: string;
  stad?: string;
  adress?: string;
  meddelande?: string;
};

export async function POST(request: Request) {
  const stoppad = rateLimit(request, "hyresvardar", { max: 5, fonsterMs: 10 * 60 * 1000 });
  if (stoppad) return stoppad;

  try {
    const body: Body = await request.json();
    const { namn, telefon, email, stad, adress, meddelande } = body;

    if (!namn || !email) {
      return Response.json({ error: "namn och email krävs" }, { status: 400 });
    }

    const anmalan = await prisma.hyresvardsanmalan.create({
      data: {
        namn,
        telefon: telefon ?? null,
        email,
        stad: stad ?? null,
        adress: adress ?? null,
        meddelande: meddelande ?? null,
      },
    });

    return Response.json(anmalan, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
