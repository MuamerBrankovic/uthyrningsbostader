import { prisma } from "@/lib/prisma";

type Body = {
  namn: string;
  telefon?: string;
  email: string;
  stad?: string;
  adress?: string;
  meddelande?: string;
};

export async function POST(request: Request) {
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
