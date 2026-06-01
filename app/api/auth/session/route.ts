import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json(null);

  const anvandare = await prisma.anvandare.findUnique({
    where: { email: session.email },
    select: { id: true, email: true, namn: true, roll: true },
  });

  if (!anvandare) return Response.json(null);

  return Response.json({
    userId: anvandare.id,
    email: anvandare.email,
    namn: anvandare.namn,
    roll: anvandare.roll,
  });
}
