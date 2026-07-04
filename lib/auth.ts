import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// I produktion måste JWT_SECRET vara satt — en tyst fallback skulle göra
// sessions-tokens förfalskningsbara med en publikt känd nyckel.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET saknas i miljön — vägrar starta i produktion");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

const COOKIE_NAME = "auth-token";

export type SessionPayload = {
  userId: string;
  email: string;
  namn: string;
  roll: string;
};

export type AdminResult =
  | { ok: true; roll: "admin"; email: string; userId: string }
  | { ok: false; status: 401 | 403; error: string };

export async function requireAdmin(): Promise<AdminResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, status: 401, error: "Ej inloggad" };
  }

  const anvandare = await prisma.anvandare.findUnique({
    where: { email: session.email },
    select: { id: true, email: true, roll: true },
  });

  if (!anvandare || anvandare.roll !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Endast administratörer kan utföra denna åtgärd",
    };
  }

  return { ok: true, roll: "admin", email: anvandare.email, userId: anvandare.id };
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
