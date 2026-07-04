import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sessionssvar får aldrig cachas — en cachad kopia gör att navbaren
// visar fel inloggningsläge tills cachen går ut
const NO_STORE = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json(null, NO_STORE);

  const anvandare = await prisma.anvandare.findUnique({
    where: { email: session.email },
    select: { id: true, email: true, namn: true, roll: true },
  });

  if (!anvandare) return Response.json(null, NO_STORE);

  return Response.json(
    {
      userId: anvandare.id,
      email: anvandare.email,
      namn: anvandare.namn,
      roll: anvandare.roll,
    },
    NO_STORE
  );
}
