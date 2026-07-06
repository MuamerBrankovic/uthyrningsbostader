# Kodgranskning — ReLoka

Detta dokument samlar de viktigaste delarna av kodbasen för en extern kodgranskning. Källfilerna är hämtade ur projektet och återges här i sin helhet. Inga `.env`-filer eller hemligheter ingår.

**Projekt:** ReLoka (ReLoka AB) — företagsbostäder i Linköping och Norrköping
**Stack:** Next.js 16 App Router · Prisma 7 + Neon PostgreSQL · Tailwind CSS · JWT (jose) + bcryptjs · Vercel Blob · Resend
**Live:** https://reloka.se

---

## Innehållsförteckning

### Konfig & datamodell
- [prisma/schema.prisma](#prismaschemaprisma)
- [lib/prisma.ts](#libprismats)
- [lib/auth.ts](#libauthts)
- [lib/email.ts](#libemailts)
- [lib/datum.ts](#libdatumts)
- [next.config.ts](#nextconfigts)
- [prisma.config.ts](#prismaconfigts)

### API-routes
- [app/api/auth/logga-in/route.ts](#appapiauthlogga-inroutets)
- [app/api/auth/registrera/route.ts](#appapiauthregistreraroutets)
- [app/api/auth/logga-ut/route.ts](#appapiauthlogga-utroutets)
- [app/api/auth/session/route.ts](#appapiauthsessionroutets)
- [app/api/auth/byt-losenord/route.ts](#appapiauthbyt-losenordroutets)
- [app/api/bostader/route.ts](#appapibostaderroutets)
- [app/api/bostader/[id]/route.ts](#appapibostaderidroutets)
- [app/api/rum/route.ts](#appapirumroutets)
- [app/api/rum/[id]/route.ts](#appapirumidroutets)
- [app/api/bokningar/route.ts](#appapibokningarroutets)
- [app/api/offert/route.ts](#appapioffertroutets)
- [app/api/hyresvardar/route.ts](#appapihyresvardarroutets)
- [app/api/upload/route.ts](#appapiuploadroutets)

### Centrala sidor & komponenter
- [app/layout.tsx](#applayouttsx)
- [app/dashboard/page.tsx](#appdashboardpagetsx)
- [app/bostad/[id]/page.tsx](#appbostadidpagetsx)
- [app/rum/[id]/RumSida.tsx](#apprumidrumsidatsx)
- [app/rum/[id]/page.tsx](#apprumidpagetsx)
- [app/bostader/page.tsx](#appbostaderpagetsx)
- [app/offert/page.tsx](#appoffertpagetsx)
- [app/components/Navbar.tsx](#appcomponentsnavbartsx)
- [app/components/OffertModal.tsx](#appcomponentsoffertmodaltsx)
- [app/components/Bildgalleri.tsx](#appcomponentsbildgalleritsx)

### Sitemap/SEO
- [app/sitemap.ts](#appsitemapts)
- [app/robots.ts](#approbotsts)

---

# Konfig & datamodell

## prisma/schema.prisma

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

model Bostad {
  id                   String   @id @default(uuid())
  namn                 String
  adress               String?
  stadsdel             String?
  beskrivning          String?
  bilder               String[]
  delade_utrymmen      String[]
  inkluderat           String[]
  narmaste_hallplats   String?
  bostadstyp           String   @default("privat_rum")
  kontaktperson_namn   String?
  kontaktperson_bild   String?
  kontaktperson_email  String?
  kontaktperson_telefon String?
  rum                  Rum[]
  created_at           DateTime @default(now())
}

model Hyresvardsanmalan {
  id          String   @id @default(uuid())
  namn        String
  telefon     String?
  email       String
  stad        String?
  adress      String?
  meddelande  String?
  created_at  DateTime @default(now())
}

model Rum {
  id          String     @id @default(uuid())
  bostad_id   String
  bostad      Bostad     @relation(fields: [bostad_id], references: [id], onDelete: Cascade)
  namn        String
  beskrivning String?
  bilder      String[]
  kvm         Int?
  manadshyra  Int
  moblering   String[]
  status      String     @default("ledig")
  bokningar   Bokning[]
  created_at  DateTime   @default(now())
}

model Bokning {
  id                 String   @id @default(uuid())
  rum_id             String
  rum                Rum      @relation(fields: [rum_id], references: [id], onDelete: Cascade)
  kund_foretag       String?
  kund_orgnr         String?
  kund_kontaktperson String
  boende_namn        String?
  email              String
  telefon            String?
  startdatum         DateTime
  slutdatum          DateTime?
  status             String   @default("forfragan")
  avtalstyp          String   @default("standard")
  created_at         DateTime @default(now())
}

model Anvandare {
  id           String   @id @default(uuid())
  email        String   @unique
  losenord     String
  namn         String
  roll         String   @default("hyresgast")
  created_at   DateTime @default(now())
}

model Offertforfragan {
  id              String    @id @default(uuid())
  foretag         String
  orgnr           String?
  kontaktperson   String
  email           String
  telefon         String
  stad            String
  antal_personer  Int?
  inflyttning     DateTime?
  bostadstyp      String?
  meddelande      String?
  status          String    @default("ny")
  created_at      DateTime  @default(now())
}
```

## lib/prisma.ts

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## lib/auth.ts

```ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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
```

## lib/email.ts

```ts
import { Resend } from "resend";
import { formateraDatum } from "@/lib/datum";

const GRON = "#2D7A4F";
const MORK = "#1a1a1a";
const LJUS = "#f8f7f4";
const ACCENT = "#e8f5ee";

type BokningData = {
  id: string;
  kund_foretag: string | null;
  kund_orgnr: string | null;
  kund_kontaktperson: string;
  boende_namn: string | null;
  email: string;
  telefon: string | null;
  startdatum: Date;
  avtalstyp: string;
};

type RumData = {
  namn: string;
  manadshyra: number;
};

type BostadData = {
  namn: string;
  stadsdel: string | null;
  adress: string | null;
};

type OffertData = {
  id: string;
  foretag: string;
  orgnr: string | null;
  kontaktperson: string;
  email: string;
  telefon: string;
  stad: string;
  antal_personer: number | null;
  inflyttning: Date | null;
  bostadstyp: string | null;
  meddelande: string | null;
};

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getConfig() {
  return {
    from: process.env.AVSANDAR_EMAIL ?? "no-reply@reloka.se",
    adminEmail: process.env.ADMIN_EMAIL ?? "",
  };
}

function avtalstypLabel(t: string): string {
  if (t === "premium") return "Premium";
  if (t === "medlemskap") return "Medlemskap";
  return "Standard";
}

function bostadstypLabel(t: string | null): string {
  if (!t) return "—";
  if (t === "privat_rum") return "Privat rum";
  if (t === "rum_eget_bad") return "Rum med eget bad";
  if (t === "hel_lagenhet") return "Hel lägenhet";
  if (t === "vet_ej") return "Vet ej";
  return t;
}

// ─── Layout-hjälpare ────────────────────────────────────────────────────────

function wrapper(innehall: string): string {
  return `
    <div style="background:${LJUS};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${MORK};">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <div style="background:#fff;padding:24px 32px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">
            Re<span style="color:${GRON};">Loka</span>
          </div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;letter-spacing:0.5px;">Linköping &amp; Norrköping</div>
        </div>
        <div style="padding:32px;">
          ${innehall}
        </div>
        <div style="background:${LJUS};padding:20px 32px;font-size:12px;color:#6b7280;border-top:1px solid #f0f0f0;">
          ReLoka AB · Linköping, Sverige<br/>
          <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
        </div>
      </div>
    </div>
  `;
}

function rad(label: string, varde: string): string {
  return `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#9ca3af;width:160px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:${MORK};">${varde}</td>
    </tr>
  `;
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "—";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Bekräftelsemail: bokning ───────────────────────────────────────────────

export async function skickaBokningsmail(
  bokning: BokningData,
  rum: RumData,
  bostad: BostadData
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY saknas — hoppar över mail-utskick");
    return { ok: false, error: "RESEND_API_KEY saknas" };
  }

  const { from, adminEmail } = getConfig();
  const plats = bostad.stadsdel ?? bostad.adress ?? bostad.namn;
  const startdatum = formateraDatum(bokning.startdatum);

  // ── Mail till kund ──
  const kundHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">
      Tack ${escapeHtml(bokning.kund_kontaktperson)}!
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      Vi har tagit emot din förfrågan. Vi återkommer normalt inom 3 timmar på vardagar
      med ett besked om tillgänglighet och nästa steg.
    </p>

    <div style="background:${ACCENT};border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${GRON};margin-bottom:8px;">
        Sammanfattning
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${rad("Rum", escapeHtml(rum.namn))}
        ${rad("Bostad", escapeHtml(bostad.namn))}
        ${rad("Plats", escapeHtml(plats))}
        ${rad("Hyra", `${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`)}
        ${rad("Startdatum", startdatum)}
        ${rad("Avtalstyp", avtalstypLabel(bokning.avtalstyp))}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:${MORK};">Frågor? Kontakta oss direkt:</p>
    <p style="margin:0;font-size:14px;">
      <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
    </p>
  `);

  // ── Mail till admin ──
  const adminHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;">
      Ny bokningsförfrågan
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
      Från ${escapeHtml(bokning.kund_kontaktperson)}${bokning.kund_foretag ? ` (${escapeHtml(bokning.kund_foretag)})` : ""}
    </p>

    <table style="width:100%;border-collapse:collapse;">
      ${rad("Företag", escapeHtml(bokning.kund_foretag))}
      ${rad("Org.nr", escapeHtml(bokning.kund_orgnr))}
      ${rad("Kontaktperson", escapeHtml(bokning.kund_kontaktperson))}
      ${rad("Boende (namn)", escapeHtml(bokning.boende_namn))}
      ${rad("E-post", escapeHtml(bokning.email))}
      ${rad("Telefon", escapeHtml(bokning.telefon))}
      ${rad("Rum", escapeHtml(rum.namn))}
      ${rad("Bostad", escapeHtml(bostad.namn))}
      ${rad("Plats", escapeHtml(plats))}
      ${rad("Hyra", `${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`)}
      ${rad("Startdatum", startdatum)}
      ${rad("Avtalstyp", avtalstypLabel(bokning.avtalstyp))}
      ${rad("Bokning-ID", bokning.id)}
    </table>
  `);

  try {
    const tasks: Promise<unknown>[] = [
      resend.emails.send({
        from,
        to: bokning.email,
        subject: "Vi har tagit emot din förfrågan — ReLoka",
        html: kundHtml,
      }),
    ];
    if (adminEmail) {
      tasks.push(
        resend.emails.send({
          from,
          to: adminEmail,
          subject: `Ny bokningsförfrågan från ${bokning.kund_kontaktperson}`,
          html: adminHtml,
        })
      );
    }
    await Promise.all(tasks);
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka bokningsmail:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Bekräftelsemail: offertförfrågan ───────────────────────────────────────

export async function skickaOffertmail(
  offert: OffertData
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY saknas — hoppar över mail-utskick");
    return { ok: false, error: "RESEND_API_KEY saknas" };
  }

  const { from, adminEmail } = getConfig();
  const inflyttning = offert.inflyttning ? formateraDatum(offert.inflyttning) : null;

  // ── Mail till kund ──
  const kundHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">
      Tack ${escapeHtml(offert.kontaktperson)}!
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      Vi har tagit emot er offertförfrågan för ${escapeHtml(offert.foretag)}.
      Vi återkommer normalt inom 3 timmar på vardagar med ett skräddarsytt förslag.
    </p>

    <div style="background:${ACCENT};border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${GRON};margin-bottom:8px;">
        Er förfrågan
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${rad("Företag", escapeHtml(offert.foretag))}
        ${rad("Stad", escapeHtml(offert.stad))}
        ${rad("Antal personer", offert.antal_personer ? String(offert.antal_personer) : "—")}
        ${rad("Önskad inflyttning", inflyttning ?? "—")}
        ${rad("Bostadstyp", bostadstypLabel(offert.bostadstyp))}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:${MORK};">Brådskande? Kontakta oss direkt:</p>
    <p style="margin:0;font-size:14px;">
      <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
    </p>
  `);

  // ── Mail till admin ──
  const adminHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;">
      Ny offertförfrågan
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
      Från ${escapeHtml(offert.kontaktperson)} (${escapeHtml(offert.foretag)})
    </p>

    <table style="width:100%;border-collapse:collapse;">
      ${rad("Företag", escapeHtml(offert.foretag))}
      ${rad("Org.nr", escapeHtml(offert.orgnr))}
      ${rad("Kontaktperson", escapeHtml(offert.kontaktperson))}
      ${rad("E-post", escapeHtml(offert.email))}
      ${rad("Telefon", escapeHtml(offert.telefon))}
      ${rad("Stad", escapeHtml(offert.stad))}
      ${rad("Antal personer", offert.antal_personer ? String(offert.antal_personer) : "—")}
      ${rad("Inflyttning", inflyttning ?? "—")}
      ${rad("Bostadstyp", bostadstypLabel(offert.bostadstyp))}
      ${rad("Meddelande", offert.meddelande ? escapeHtml(offert.meddelande).replace(/\n/g, "<br/>") : "—")}
      ${rad("Offert-ID", offert.id)}
    </table>
  `);

  try {
    const tasks: Promise<unknown>[] = [
      resend.emails.send({
        from,
        to: offert.email,
        subject: "Vi har tagit emot er offertförfrågan — ReLoka",
        html: kundHtml,
      }),
    ];
    if (adminEmail) {
      tasks.push(
        resend.emails.send({
          from,
          to: adminEmail,
          subject: `Ny offertförfrågan från ${offert.kontaktperson} (${offert.foretag})`,
          html: adminHtml,
        })
      );
    }
    await Promise.all(tasks);
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka offertmail:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
```

## lib/datum.ts

```ts
export function formateraDatum(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formateraKortDatum(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
  }).format(date);
}
```

## next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.16"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
```

## prisma.config.ts

```ts
import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

---

# API-routes

## app/api/auth/logga-in/route.ts

```ts
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
```

## app/api/auth/registrera/route.ts

```ts
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
```

## app/api/auth/logga-ut/route.ts

```ts
import { deleteSession } from "@/lib/auth";

export async function POST() {
  await deleteSession();
  return Response.json({ ok: true });
}
```

## app/api/auth/session/route.ts

```ts
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
```

## app/api/auth/byt-losenord/route.ts

```ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

const MIN_LANGD = 8;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const body = await request.json();
    const { nuvarandeLosenord, nyttLosenord } = body;

    if (!nuvarandeLosenord || !nyttLosenord) {
      return Response.json(
        { error: "Både nuvarande och nytt lösenord krävs" },
        { status: 400 }
      );
    }

    if (typeof nyttLosenord !== "string" || nyttLosenord.length < MIN_LANGD) {
      return Response.json(
        { error: `Det nya lösenordet måste vara minst ${MIN_LANGD} tecken` },
        { status: 400 }
      );
    }

    const anvandare = await prisma.anvandare.findUnique({
      where: { email: session.email },
    });
    if (!anvandare) {
      return Response.json({ error: "Användare hittades inte" }, { status: 404 });
    }

    const match = await bcrypt.compare(nuvarandeLosenord, anvandare.losenord);
    if (!match) {
      return Response.json(
        { error: "Nuvarande lösenord är felaktigt" },
        { status: 400 }
      );
    }

    const nyHash = await bcrypt.hash(nyttLosenord, 10);
    await prisma.anvandare.update({
      where: { id: anvandare.id },
      data: { losenord: nyHash },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
```

## app/api/bostader/route.ts

```ts
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const bostader = await prisma.bostad.findMany({
      include: {
        rum: {
          include: {
            bokningar: {
              where: { status: { not: "avbokad" } },
              orderBy: { startdatum: "desc" },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return Response.json(bostader);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const {
    namn, adress, stadsdel, beskrivning, bilder, delade_utrymmen, inkluderat,
    kontaktperson_namn, kontaktperson_bild, kontaktperson_email, kontaktperson_telefon,
  } = body;

  if (!namn) {
    return Response.json({ error: "Namn krävs" }, { status: 400 });
  }

  const bostad = await prisma.bostad.create({
    data: {
      namn,
      adress: adress ?? null,
      stadsdel: stadsdel ?? null,
      beskrivning: beskrivning ?? null,
      bilder: Array.isArray(bilder) ? bilder : [],
      delade_utrymmen: Array.isArray(delade_utrymmen) ? delade_utrymmen : [],
      inkluderat: Array.isArray(inkluderat) ? inkluderat : [],
      kontaktperson_namn: kontaktperson_namn ?? null,
      kontaktperson_bild: kontaktperson_bild ?? null,
      kontaktperson_email: kontaktperson_email ?? null,
      kontaktperson_telefon: kontaktperson_telefon ?? null,
    },
  });

  return Response.json(bostad, { status: 201 });
}
```

## app/api/bostader/[id]/route.ts

```ts
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bostad = await prisma.bostad.findUnique({
      where: { id },
      include: {
        rum: {
          include: {
            bokningar: {
              where: { status: { not: "avbokad" } },
              orderBy: { startdatum: "asc" },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!bostad) {
      return Response.json({ error: "Bostad hittades inte" }, { status: 404 });
    }

    return Response.json(bostad);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
```

## app/api/rum/route.ts

```ts
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { bostad_id, namn, beskrivning, bilder, kvm, manadshyra, moblering } = body;

    if (!bostad_id || !namn || manadshyra == null) {
      return Response.json({ error: "bostad_id, namn och manadshyra krävs" }, { status: 400 });
    }

    const rum = await prisma.rum.create({
      data: {
        bostad_id,
        namn,
        beskrivning: beskrivning ?? null,
        bilder: Array.isArray(bilder) ? bilder : [],
        kvm: kvm ? Number(kvm) : null,
        manadshyra: Number(manadshyra),
        moblering: Array.isArray(moblering) ? moblering : [],
      },
    });

    return Response.json(rum, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
```

## app/api/rum/[id]/route.ts

```ts
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rum = await prisma.rum.findUnique({
      where: { id },
      include: {
        bostad: true,
        bokningar: {
          where: { status: { not: "avbokad" } },
          orderBy: { startdatum: "asc" },
        },
      },
    });

    if (!rum) {
      return Response.json({ error: "Rum hittades inte" }, { status: 404 });
    }

    return Response.json(rum);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
```

## app/api/bokningar/route.ts

```ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { skickaBokningsmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const bokningar = await prisma.bokning.findMany({
      where: { email: session.email },
      include: {
        rum: {
          include: { bostad: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return Response.json(bokningar);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}

type BokningBody = {
  rum_id: string;
  kund_foretag?: string;
  kund_orgnr?: string;
  kund_kontaktperson: string;
  boende_namn?: string;
  email: string;
  telefon?: string;
  startdatum: string;
  avtalstyp?: string;
};

export async function POST(request: Request) {
  try {
    const body: BokningBody = await request.json();
    const {
      rum_id,
      kund_foretag,
      kund_orgnr,
      kund_kontaktperson,
      boende_namn,
      email,
      telefon,
      startdatum,
      avtalstyp,
    } = body;

    if (!rum_id || !kund_kontaktperson || !email || !startdatum) {
      return Response.json(
        { error: "rum_id, kund_kontaktperson, email och startdatum krävs" },
        { status: 400 }
      );
    }

    const startDate = new Date(startdatum);
    if (isNaN(startDate.getTime())) {
      return Response.json({ error: "Ogiltigt startdatum" }, { status: 400 });
    }

    const rum = await prisma.rum.findUnique({
      where: { id: rum_id },
      include: {
        bostad: { select: { namn: true, stadsdel: true, adress: true } },
        bokningar: { where: { status: { not: "avbokad" } } },
      },
    });

    if (!rum) {
      return Response.json({ error: "Rum hittades inte" }, { status: 404 });
    }

    const forstaLediga = getForstaLedigaDatum(rum);
    if (startDate < forstaLediga) {
      const formatted = forstaLediga.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return Response.json(
        { error: `Startdatum måste vara från och med ${formatted}` },
        { status: 400 }
      );
    }

    const bokning = await prisma.bokning.create({
      data: {
        rum_id,
        kund_foretag: kund_foretag ?? null,
        kund_orgnr: kund_orgnr ?? null,
        kund_kontaktperson,
        boende_namn: boende_namn ?? null,
        email,
        telefon: telefon ?? null,
        startdatum: startDate,
        avtalstyp: avtalstyp ?? "standard",
      },
    });

    // Bekräftelsemail — får ALDRIG blockera success-svaret
    skickaBokningsmail(
      bokning,
      { namn: rum.namn, manadshyra: rum.manadshyra },
      rum.bostad
    ).catch((err) => console.error("[email] Uncaught bokningsmail-fel:", err));

    return Response.json(bokning, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}

type RumWithBokningar = {
  status: string;
  bokningar: { slutdatum: Date | null; startdatum: Date }[];
};

function getForstaLedigaDatum(rum: RumWithBokningar): Date {
  const active = rum.bokningar;

  if (active.length === 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 10);
    return far;
  }

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  latest.setDate(latest.getDate() + 1);
  latest.setHours(0, 0, 0, 0);
  return latest;
}
```

## app/api/offert/route.ts

```ts
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { skickaOffertmail } from "@/lib/email";

type OffertBody = {
  foretag: string;
  orgnr?: string;
  kontaktperson: string;
  email: string;
  telefon: string;
  stad: string;
  antal_personer?: number | string;
  inflyttning?: string;
  bostadstyp?: string;
  meddelande?: string;
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const offerter = await prisma.offertforfragan.findMany({
    orderBy: { created_at: "desc" },
  });
  return Response.json(offerter);
}

export async function POST(request: Request) {
  try {
    const body: OffertBody = await request.json();
    const {
      foretag,
      orgnr,
      kontaktperson,
      email,
      telefon,
      stad,
      antal_personer,
      inflyttning,
      bostadstyp,
      meddelande,
    } = body;

    if (!foretag || !kontaktperson || !email || !telefon || !stad) {
      return Response.json(
        { error: "foretag, kontaktperson, email, telefon och stad krävs" },
        { status: 400 }
      );
    }

    let inflyttningDate: Date | null = null;
    if (inflyttning) {
      const d = new Date(inflyttning);
      if (!isNaN(d.getTime())) inflyttningDate = d;
    }

    let antalPersoner: number | null = null;
    if (antal_personer != null && antal_personer !== "") {
      const n = Number(antal_personer);
      if (Number.isFinite(n) && n > 0) antalPersoner = Math.floor(n);
    }

    const offert = await prisma.offertforfragan.create({
      data: {
        foretag,
        orgnr: orgnr ?? null,
        kontaktperson,
        email,
        telefon,
        stad,
        antal_personer: antalPersoner,
        inflyttning: inflyttningDate,
        bostadstyp: bostadstyp ?? null,
        meddelande: meddelande ?? null,
      },
    });

    // Mail får ALDRIG blockera sparandet
    skickaOffertmail(offert).catch((err) =>
      console.error("[email] Uncaught offertmail-fel:", err)
    );

    return Response.json(offert, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serverfel" }, { status: 500 });
  }
}
```

## app/api/hyresvardar/route.ts

```ts
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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
```

## app/api/upload/route.ts

```ts
import { requireAdmin } from "@/lib/auth";
import type { NextRequest } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 85;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Ingen fil skickad" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Bara jpg, png och webp är tillåtna" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Filen får max vara 5 MB" }, { status: 400 });
  }

  // Optimera: max 1920px bredd (förstora aldrig), konvertera till WebP q85
  let optimized: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    optimized = await sharp(inputBuffer)
      .rotate() // respektera EXIF-orientering
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    console.error("[upload] sharp-fel:", err);
    return Response.json({ error: "Kunde inte bearbeta bilden" }, { status: 400 });
  }

  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(baseName, optimized, {
      access: "public",
      contentType: "image/webp",
    });
    return Response.json({ url: blob.url });
  }

  // Lokal fallback: spara i public/uploads/
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, baseName), optimized);

  return Response.json({ url: `/uploads/${baseName}` });
}
```

---

# Centrala sidor & komponenter

## app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/app/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ReLoka — Företagsbostäder i Linköping och Norrköping",
    template: "%s | ReLoka",
  },
  description:
    "ReLoka hjälper HR-chefer och konsultansvariga att snabbt hitta möblerade bostäder i Linköping och Norrköping. Flexibla avtal, fullt möblerat, ingen mäklare.",
  openGraph: {
    title: "ReLoka — Företagsbostäder i Linköping och Norrköping",
    description:
      "Möblerade bostäder för konsulter och tjänsteresenärer. Flexibla avtal utan krångel.",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReLoka — Företagsbostäder i Linköping och Norrköping",
    description:
      "Möblerade bostäder för konsulter och tjänsteresenärer. Flexibla avtal utan krångel.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## app/dashboard/page.tsx

```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formateraDatum } from "@/lib/datum";

type RumInfo = {
  id: string;
  namn: string;
  manadshyra: number;
  bostad: { id: string; namn: string; stadsdel: string | null };
};

type Bokning = {
  id: string;
  kund_kontaktperson: string;
  boende_namn: string | null;
  email: string;
  startdatum: string;
  slutdatum: string | null;
  status: string;
  avtalstyp: string;
  created_at: string;
  rum: RumInfo;
};

type BostadOption = {
  id: string;
  namn: string;
  stadsdel: string | null;
  adress: string | null;
};

type Session = { userId: string; email: string; namn: string; roll: string } | null;

type Flik =
  | "bokningar"
  | "konto"
  | "laggUppBostad"
  | "laggUppRum"
  | "offerter"
  | "hyresvardsanmalningar";

type Offert = {
  id: string;
  foretag: string;
  orgnr: string | null;
  kontaktperson: string;
  email: string;
  telefon: string;
  stad: string;
  antal_personer: number | null;
  inflyttning: string | null;
  bostadstyp: string | null;
  meddelande: string | null;
  status: string;
  created_at: string;
};

type Hyresvardsanmalan = {
  id: string;
  namn: string;
  telefon: string | null;
  email: string;
  stad: string | null;
  adress: string | null;
  meddelande: string | null;
  created_at: string;
};

function bostadstypLabel(t: string | null): string {
  if (!t) return "—";
  if (t === "privat_rum") return "Privat rum";
  if (t === "rum_eget_bad") return "Rum med eget bad";
  if (t === "hel_lagenhet") return "Hel lägenhet";
  if (t === "vet_ej") return "Vet ej";
  return t;
}

const INPUT_CLS =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors";

const LABEL_CLS =
  "text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2";

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

// ─── Bilduppladdning ─────────────────────────────────────────────────────────

type UploadItem = {
  id: number;
  file: File;
  url: string | null;
  uploading: boolean;
  error: string | null;
};

function BildUppladdning({
  onBilderChange,
  disabled,
}: {
  onBilderChange: (urls: string[]) => void;
  disabled: boolean;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const nextId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onBilderChange(items.filter((i) => i.url).map((i) => i.url!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function handleFiles(files: FileList) {
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: nextId.current++,
      file,
      url: null,
      uploading: true,
      error: null,
    }));

    setItems((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      const formData = new FormData();
      formData.append("file", item.file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, url: res.ok ? data.url : null, uploading: false, error: res.ok ? null : (data.error ?? "Fel") }
              : i
          )
        );
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, uploading: false, error: "Uppladdning misslyckades" } : i
          )
        );
      }
    }
  }

  function taBort(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const uploading = items.some((i) => i.uploading);

  return (
    <div>
      <label className={LABEL_CLS}>Bilder</label>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
          disabled ? "border-gray-100 cursor-default" : "border-gray-200 hover:border-[#2D7A4F] cursor-pointer"
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#2D7A4F]">Laddar upp bilder...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400">Klicka för att välja bilder</p>
            <p className="text-xs text-gray-300 mt-1">jpg, png, webp · max 5 MB per bild</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0"
            >
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : item.uploading ? (
                <div className="w-5 h-5 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-red-400 text-xs text-center px-1 leading-tight">{item.error ?? "Fel"}</span>
              )}
              {!item.uploading && (
                <button
                  type="button"
                  onClick={() => taBort(item.id)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors leading-none"
                  aria-label="Ta bort bild"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flik: Mina bokningar ────────────────────────────────────────────────────

function MinaBokningar({ bokningar }: { bokningar: Bokning[] }) {
  if (bokningar.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-4xl mb-4">🏠</p>
        <p className="text-gray-400 text-sm">Du har inga bokningar ännu.</p>
        <a
          href="/bostader"
          className="inline-block mt-4 bg-[#2D7A4F] text-white text-sm px-6 py-2.5 rounded-full hover:bg-[#225f3d] transition-colors"
        >
          Hitta ett rum
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bokningar.map((b) => (
        <div
          key={b.id}
          className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-4"
        >
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-[#e8f5ee] rounded-xl flex items-center justify-center text-xl shrink-0">
              🛏
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a]">{b.rum?.namn}</h3>
              <p className="text-sm text-gray-400">{b.rum?.bostad?.namn}</p>
              <p className="text-xs text-gray-400 mt-1">
                Från {formateraDatum(b.startdatum)}
                {b.slutdatum ? ` → ${formateraDatum(b.slutdatum)}` : " (tills vidare)"}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-2">
            <p className="text-[#2D7A4F] font-bold">
              {b.rum?.manadshyra?.toLocaleString()} kr/mån
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span
                className={`inline-block text-xs px-3 py-1 rounded-full ${
                  b.status === "bekraftad"
                    ? "bg-green-100 text-green-700"
                    : "bg-[#e8f5ee] text-[#2D7A4F]"
                }`}
              >
                {b.status === "bekraftad" ? "Bekräftad" : "Förfrågan skickad"}
              </span>
              <span className="inline-block text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                {b.avtalstyp === "standard" ? "Standard" : b.avtalstyp === "premium" ? "Premium" : "Medlemskap"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Flik: Lägg upp bostad ───────────────────────────────────────────────────

function LaggUppBostad() {
  const [namn, setNamn] = useState("");
  const [adress, setAdress] = useState("");
  const [stadsdel, setStadsdel] = useState("");
  const [beskrivning, setBeskrivning] = useState("");
  const [deladeUtrymmen, setDeladeUtrymmen] = useState("");
  const [inkluderat, setInkluderat] = useState("");
  const [bildUrls, setBildUrls] = useState<string[]>([]);
  const [kontaktNamn, setKontaktNamn] = useState("");
  const [kontaktEmail, setKontaktEmail] = useState("");
  const [kontaktTelefon, setKontaktTelefon] = useState("");
  const [kontaktBildUrls, setKontaktBildUrls] = useState<string[]>([]);
  const [sparad, setSparad] = useState(false);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState("");

  async function handleSubmit() {
    if (!namn) return;
    setLaddar(true);
    setFel("");

    const res = await fetch("/api/bostader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namn,
        adress: adress || null,
        stadsdel: stadsdel || null,
        beskrivning: beskrivning || null,
        bilder: bildUrls,
        delade_utrymmen: parseList(deladeUtrymmen),
        inkluderat: parseList(inkluderat),
        kontaktperson_namn: kontaktNamn || null,
        kontaktperson_email: kontaktEmail || null,
        kontaktperson_telefon: kontaktTelefon || null,
        kontaktperson_bild: kontaktBildUrls[0] ?? null,
      }),
    });

    if (res.ok) {
      setSparad(true);
      setNamn("");
      setAdress("");
      setStadsdel("");
      setBeskrivning("");
      setDeladeUtrymmen("");
      setInkluderat("");
      setBildUrls([]);
      setKontaktNamn("");
      setKontaktEmail("");
      setKontaktTelefon("");
      setKontaktBildUrls([]);
      setTimeout(() => setSparad(false), 5000);
    } else {
      const data = await res.json();
      setFel(data.error ?? "Något gick fel.");
    }
    setLaddar(false);
  }

  const submitDisabled = !namn || laddar;

  // [Formulär-JSX för LaggUppBostad — utelämnat för plats; ingen säkerhetslogik]
  return null;
}

// [LaggUppRum, Offertforfragningar, Hyresvardsanmalningar, FaktaRad — utelämnade för plats; återges nedan i förkortad form]

// ─── Flik: Mitt konto ────────────────────────────────────────────────────────

function MittKonto({ session }: { session: NonNullable<Session> }) {
  const [nuvarande, setNuvarande] = useState("");
  const [nyttLosenord, setNyttLosenord] = useState("");
  const [bekrafta, setBekrafta] = useState("");
  const [laddar, setLaddar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fel, setFel] = useState("");

  const matchar = nyttLosenord !== "" && nyttLosenord === bekrafta;
  const tillrackligtLangt = nyttLosenord.length >= 8;
  const kanSpara = nuvarande.length > 0 && tillrackligtLangt && matchar && !laddar;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kanSpara) return;
    setLaddar(true);
    setFel("");
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/byt-losenord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nuvarandeLosenord: nuvarande,
          nyttLosenord,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setNuvarande("");
        setNyttLosenord("");
        setBekrafta("");
        setTimeout(() => setSuccess(false), 6000);
      } else {
        setFel(data.error ?? "Kunde inte byta lösenord");
      }
    } catch {
      setFel("Kunde inte skicka. Kontrollera anslutningen.");
    }
    setLaddar(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 max-w-xl">
      <h2 className="font-semibold text-[#1a1a1a] mb-1">Kontouppgifter</h2>
      <p className="text-sm text-gray-400 mb-6">
        Inloggad som <span className="text-[#1a1a1a] font-medium">{session.email}</span>
      </p>
      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-semibold text-[#1a1a1a] mb-1">Byt lösenord</h3>
        <p className="text-xs text-gray-400 mb-5">
          Minst 8 tecken. Använd ett unikt lösenord du inte använder någon annanstans.
        </p>
        {success && (
          <div className="bg-[#e8f5ee] text-[#2D7A4F] text-sm px-4 py-3 rounded-xl mb-5">
            ✓ Lösenordet har bytts.
          </div>
        )}
        {fel && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">
            {fel}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Nuvarande lösenord</label>
            <input type="password" autoComplete="current-password" value={nuvarande}
              onChange={(e) => setNuvarande(e.target.value)} className={INPUT_CLS}
              disabled={laddar} required />
          </div>
          <div>
            <label className={LABEL_CLS}>Nytt lösenord</label>
            <input type="password" autoComplete="new-password" value={nyttLosenord}
              onChange={(e) => setNyttLosenord(e.target.value)} className={INPUT_CLS}
              disabled={laddar} required minLength={8} />
            {nyttLosenord.length > 0 && !tillrackligtLangt && (
              <p className="text-xs text-red-400 mt-1">Minst 8 tecken</p>
            )}
          </div>
          <div>
            <label className={LABEL_CLS}>Bekräfta nytt lösenord</label>
            <input type="password" autoComplete="new-password" value={bekrafta}
              onChange={(e) => setBekrafta(e.target.value)} className={INPUT_CLS}
              disabled={laddar} required />
            {bekrafta.length > 0 && !matchar && (
              <p className="text-xs text-red-400 mt-1">Lösenorden matchar inte</p>
            )}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={!kanSpara}
              className="bg-[#2D7A4F] text-white text-sm font-medium px-8 py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {laddar ? "Sparar..." : "Byt lösenord"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Huvud-komponent ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [session, setSession] = useState<Session>(null);
  const [bokningar, setBokningar] = useState<Bokning[]>([]);
  const [laddar, setLaddar] = useState(true);
  const [aktivFlik, setAktivFlik] = useState<Flik>("bokningar");
  const router = useRouter();

  useEffect(() => {
    async function hamtaData() {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData: Session = await sessionRes.json();

      if (!sessionData) {
        router.push("/logga-in");
        return;
      }

      setSession(sessionData);

      const bokRes = await fetch("/api/bokningar");
      if (bokRes.ok) {
        const data = await bokRes.json();
        setBokningar(Array.isArray(data) ? data : []);
      }
      setLaddar(false);
    }
    hamtaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (laddar) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Laddar dashboard...</p>
        </div>
      </main>
    );
  }

  const isAdmin = session?.roll === "admin";

  const flikar: { key: Flik; label: string }[] = [
    { key: "bokningar", label: "Mina bokningar" },
    ...(isAdmin
      ? ([
          { key: "offerter", label: "Offertförfrågningar" },
          { key: "hyresvardsanmalningar", label: "Hyresvärdsanmälningar" },
          { key: "laggUppBostad", label: "Lägg upp bostad" },
          { key: "laggUppRum", label: "Lägg upp rum" },
        ] as { key: Flik; label: string }[])
      : []),
    { key: "konto", label: "Mitt konto" },
  ];

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Min dashboard</h1>
          {session && (
            <span className="text-sm text-gray-400 md:mt-1.5">
              Inloggad som <span className="text-[#1a1a1a] font-medium">{session.namn}</span>
              {isAdmin && (
                <span className="ml-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-[#2D7A4F] bg-[#e8f5ee] px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-gray-400 mb-10">
          {isAdmin ? "Hantera bokningar, offerter och bostäder" : "Översikt över dina bokningar"}
        </p>

        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl border border-gray-100 w-fit mb-8 overflow-x-auto max-w-full">
          {flikar.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAktivFlik(key)}
              className={`text-sm px-4 md:px-5 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                aktivFlik === key ? "bg-[#2D7A4F] text-white" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {aktivFlik === "bokningar" && <MinaBokningar bokningar={bokningar} />}
        {aktivFlik === "konto" && session && <MittKonto session={session} />}
        {/* Admin-flikar (Offertforfragningar / Hyresvardsanmalningar / LaggUppBostad / LaggUppRum) renderas analogt här */}
      </div>
    </main>
  );
}
```

> **Notering till granskaren:** `app/dashboard/page.tsx` är ~1135 rader. De delar som utelämnats ovan (`LaggUppBostad`-formulär-JSX, `LaggUppRum`, `Offertforfragningar`, `Hyresvardsanmalningar`, `FaktaRad`) är rena visnings-/formulärkomponenter utan säkerhets-, auth- eller affärslogik — alla mutationer går via redan listade API-routes med `requireAdmin`-skydd. Be om hela filen om du vill se dem.

## app/bostad/[id]/page.tsx

```tsx
"use client";
import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import Bildgalleri from "@/app/components/Bildgalleri";
import BildPlatshallare from "@/app/components/BildPlatshallare";
import { formateraDatum, formateraKortDatum } from "@/lib/datum";
import {
  BedDouble,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  CalendarDays,
  MapPin,
  ArrowLeft,
} from "lucide-react";

// ─── Typer ───────────────────────────────────────────────────────────────────

type Bokning = {
  id: string;
  startdatum: string;
  slutdatum: string | null;
  status: string;
};

type Rum = {
  id: string;
  namn: string;
  bilder: string[];
  kvm: number | null;
  manadshyra: number;
  status: string;
  bokningar: Bokning[];
};

type Bostad = {
  id: string;
  namn: string;
  adress: string | null;
  stadsdel: string | null;
  beskrivning: string | null;
  bilder: string[];
  delade_utrymmen: string[];
  inkluderat: string[];
  narmaste_hallplats: string | null;
  rum: Rum[];
};

type RumStatus =
  | { typ: "ledig" }
  | { typ: "ledigt-fran"; datum: Date }
  | { typ: "bokat"; slutdatum: Date | null };

// ─── Status-helpers ───────────────────────────────────────────────────────────

function getRumStatus(rum: Rum): RumStatus {
  const active = rum.bokningar.filter((b) => {
    if (b.status === "avbokad") return false;
    if (!b.slutdatum) return true;
    return new Date(b.slutdatum) > new Date();
  });

  if (active.length === 0) return { typ: "ledig" };

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) return { typ: "bokat", slutdatum: null };

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  const fran = new Date(latest);
  fran.setDate(fran.getDate() + 1);
  return { typ: "ledigt-fran", datum: fran };
}

function getNarmstaLedigaDatum(rum: Rum[]): string {
  if (rum.length === 0) return "—";
  if (rum.some((r) => getRumStatus(r).typ === "ledig")) return "Idag";

  const dates = rum
    .map((r) => getRumStatus(r))
    .filter((s): s is { typ: "ledigt-fran"; datum: Date } => s.typ === "ledigt-fran")
    .map((s) => s.datum);

  if (dates.length === 0) return "—";
  const earliest = dates.reduce((min, d) => (d < min ? d : min));
  return formateraKortDatum(earliest);
}

// ─── Status-badge (text) ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RumStatus }) {
  if (status.typ === "ledig") {
    return (
      <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full whitespace-nowrap">
        Ledigt nu
      </span>
    );
  }
  if (status.typ === "ledigt-fran") {
    return (
      <span className="inline-block text-xs font-semibold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full whitespace-nowrap">
        Ledigt från {formateraKortDatum(status.datum)}
      </span>
    );
  }
  return (
    <span className="inline-block text-xs font-semibold bg-red-100 text-red-500 px-3 py-1 rounded-full whitespace-nowrap">
      {status.slutdatum ? `Bokat till ${formateraKortDatum(status.slutdatum)}` : "Bokat"}
    </span>
  );
}

// ─── Status-cirkel (ikon) ─────────────────────────────────────────────────────

function StatusCirkel({ status }: { status: RumStatus }) {
  if (status.typ === "ledig") {
    return (
      <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow">
        <CheckCircle className="w-4 h-4 text-white" />
      </span>
    );
  }
  if (status.typ === "ledigt-fran") {
    return (
      <span className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow">
        <Clock className="w-4 h-4 text-white" />
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow">
      <XCircle className="w-4 h-4 text-white" />
    </span>
  );
}

// ─── Faktarad ────────────────────────────────────────────────────────────────

function Faktarad({ bostad }: { bostad: Bostad }) {
  const ledigaRum = bostad.rum.filter((r) => getRumStatus(r).typ === "ledig").length;
  const narmstLedigt = getNarmstaLedigaDatum(bostad.rum);

  const stats = [
    { label: "Antal rum", value: String(bostad.rum.length), grön: false,
      icon: <BedDouble className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" /> },
    { label: "Lediga just nu", value: String(ledigaRum), grön: ledigaRum > 0,
      icon: <Users className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" /> },
    { label: "Närmst ledigt", value: narmstLedigt, grön: false,
      icon: <CalendarDays className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" /> },
    { label: "Närmaste hållplats", value: bostad.narmaste_hallplats ?? "—", grön: false,
      icon: <MapPin className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#e8f5ee] rounded-2xl p-5 text-center">
          {s.icon}
          <p className={`text-2xl font-bold ${s.grön ? "text-green-600" : "text-[#2D7A4F]"}`}>
            {s.value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Popup-innehåll ───────────────────────────────────────────────────────────

function getPopupContent(status: RumStatus): { text: string; knappText: string | null } {
  if (status.typ === "ledig") {
    return { text: "Tillgängligt direkt. Boka från valfritt datum från och med idag.",
             knappText: "Boka rum" };
  }
  if (status.typ === "ledigt-fran") {
    return {
      text: `Blir tillgängligt ${formateraDatum(status.datum)}. Boka från och med detta datum.`,
      knappText: `Boka från ${formateraKortDatum(status.datum)}`,
    };
  }
  if (status.slutdatum) {
    const nasta = new Date(status.slutdatum);
    nasta.setDate(nasta.getDate() + 1);
    return {
      text: `För närvarande bokat till och med ${formateraDatum(status.slutdatum)}. Nya bokningar kan göras från ${formateraDatum(nasta)}.`,
      knappText: `Boka från ${formateraKortDatum(nasta)}`,
    };
  }
  return {
    text: "För närvarande bokat tills vidare. Kontakta oss för mer information.",
    knappText: null,
  };
}

// ─── Rumkort med hover-overlay + mobilbottomsheet ─────────────────────────────

function RumKort({ rum }: { rum: Rum }) {
  const [hovering, setHovering] = useState(false);
  const [bottomSheet, setBottomSheet] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const status = getRumStatus(rum);
  const { text, knappText } = getPopupContent(status);
  const cta = knappText ?? "Visa rum";

  useEffect(() => {
    if (!bottomSheet) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const insideCard = containerRef.current?.contains(target);
      const insideSheet = sheetRef.current?.contains(target);
      if (!insideCard && !insideSheet) {
        setBottomSheet(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [bottomSheet]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative group"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <Link
          href={`/rum/${rum.id}`}
          className={`block bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 ${
            hovering ? "shadow-md -translate-y-0.5" : "shadow-sm"
          }`}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-[#e8f5ee]">
            {rum.bilder.length > 0 ? (
              <Image
                src={rum.bilder[0]}
                alt={rum.namn}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <BildPlatshallare className="absolute inset-0" text="Bild saknas" />
            )}

            <div className="absolute top-2.5 right-2.5 z-10">
              <StatusCirkel status={status} />
            </div>

            <button
              className="absolute bottom-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full text-white text-sm font-bold transition-colors md:hidden z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBottomSheet((v) => !v);
              }}
              aria-label="Visa tillgänglighetsinformation"
            >
              i
            </button>

            <div
              className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm px-4 pt-3 pb-4 transition-all duration-200 hidden md:block ${
                hovering ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <StatusCirkel status={status} />
                <StatusBadge status={status} />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{text}</p>
              <span className="block w-full text-center bg-[#2D7A4F] text-white text-xs font-semibold py-2.5 rounded-xl">
                {cta}
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-[#1a1a1a] mb-1">{rum.namn}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              {rum.kvm && <span>{rum.kvm} kvm</span>}
              {rum.kvm && <span>·</span>}
              <span className="font-semibold text-[#2D7A4F]">
                från {rum.manadshyra.toLocaleString()} kr/mån
              </span>
            </div>
            <StatusBadge status={status} />
          </div>
        </Link>
      </div>

      {bottomSheet && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setBottomSheet(false)}>
          <div
            ref={sheetRef}
            className="w-full bg-white rounded-t-2xl shadow-xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-3">
              <StatusCirkel status={status} />
              <div>
                <p className="font-semibold text-[#1a1a1a] text-sm">{rum.namn}</p>
                <StatusBadge status={status} />
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{text}</p>
            <Link
              href={`/rum/${rum.id}`}
              className="block w-full text-center bg-[#2D7A4F] text-white text-sm font-semibold py-3.5 rounded-xl"
              onClick={() => setBottomSheet(false)}
            >
              {cta}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Huvudkomponent ───────────────────────────────────────────────────────────

export default function BostadSida({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [bostad, setBostad] = useState<Bostad | null>(null);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    fetch(`/api/bostader/${resolvedParams.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setBostad(data);
        setLaddar(false);
      })
      .catch(() => {
        setBostad(null);
        setLaddar(false);
      });
  }, [resolvedParams.id]);

  if (laddar) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Hämtar bostad...</p>
        </div>
      </main>
    );
  }

  if (!bostad) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]">Bostad hittades inte</p>
          <Link href="/bostader" className="text-[#2D7A4F] text-sm mt-4 block hover:underline">
            ← Tillbaka till alla bostäder
          </Link>
        </div>
      </main>
    );
  }

  const ledigaRum = bostad.rum.filter((r) => getRumStatus(r).typ === "ledig").length;

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="relative h-[250px] md:h-[400px] w-full overflow-hidden">
        {bostad.bilder.length > 0 ? (
          <Image
            src={bostad.bilder[0]}
            alt={bostad.namn}
            fill
            priority
            quality={85}
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <BildPlatshallare className="absolute inset-0" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow">{bostad.namn}</h1>
          {(bostad.stadsdel || bostad.adress) && (
            <p className="text-white/80 text-sm mt-1 drop-shadow">
              {[bostad.stadsdel, bostad.adress].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <Link href="/bostader"
          className="inline-flex items-center gap-1.5 text-sm text-[#2D7A4F] hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till alla bostäder
        </Link>

        <Faktarad bostad={bostad} />

        {bostad.bilder.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">
              Delade utrymmen och bostaden
            </h2>
            <Bildgalleri
              bilder={
                bostad.bilder.length > 1
                  ? [...bostad.bilder.slice(1), bostad.bilder[0]]
                  : bostad.bilder
              }
              alt={bostad.namn}
            />
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {bostad.beskrivning && (
            <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">Om bostaden</h2>
              <p className="text-base text-gray-700 leading-relaxed">{bostad.beskrivning}</p>
            </div>
          )}

          {bostad.delade_utrymmen.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Delade utrymmen</h2>
              <ul className="space-y-2">
                {bostad.delade_utrymmen.map((u) => (
                  <li key={u} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D7A4F] shrink-0" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bostad.inkluderat.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Vad ingår</h2>
              <div className="flex flex-wrap gap-2">
                {bostad.inkluderat.map((item) => (
                  <span key={item}
                    className="text-xs font-medium bg-[#e8f5ee] text-[#2D7A4F] px-3 py-1.5 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a1a]">
                Tillgängliga rum
                {ledigaRum > 0 && (
                  <span className="ml-3 text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full align-middle">
                    {ledigaRum} {ledigaRum === 1 ? "ledigt" : "lediga"}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">
                Håll muspekaren över ett rum för statusinformation
              </p>
              <p className="text-sm text-gray-500 mt-1 md:hidden">
                Tryck på <span className="font-semibold">i</span>-ikonen för statusinformation
              </p>
            </div>
          </div>

          {bostad.rum.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400">Inga rum tillagda ännu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bostad.rum.map((rum) => (
                <RumKort key={rum.id} rum={rum} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

## app/rum/[id]/RumSida.tsx

```tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Bildgalleri from "@/app/components/Bildgalleri";
import { formateraDatum, formateraKortDatum } from "@/lib/datum";
import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";

type Bokning = {
  id: string;
  startdatum: string;
  slutdatum: string | null;
  status: string;
};

type Rum = {
  id: string;
  namn: string;
  beskrivning: string | null;
  bilder: string[];
  kvm: number | null;
  manadshyra: number;
  moblering: string[];
  status: string;
  bokningar: Bokning[];
  bostad: {
    id: string;
    namn: string;
    adress: string | null;
    stadsdel: string | null;
    kontaktperson_namn: string | null;
    kontaktperson_bild: string | null;
    kontaktperson_email: string | null;
    kontaktperson_telefon: string | null;
  };
};

function getForstaLedigaDatum(bokningar: Bokning[]): string {
  const active = bokningar.filter((b) => {
    if (b.status === "avbokad") return false;
    if (!b.slutdatum) return true;
    return new Date(b.slutdatum) > new Date();
  });

  if (active.length === 0) return new Date().toISOString().split("T")[0];

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 10);
    return far.toISOString().split("T")[0];
  }

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  latest.setDate(latest.getDate() + 1);
  return latest.toISOString().split("T")[0];
}

function getRumStatusLabel(bokningar: Bokning[]): { label: string; color: string } {
  const active = bokningar.filter((b) => {
    if (b.status === "avbokad") return false;
    if (!b.slutdatum) return true;
    return new Date(b.slutdatum) > new Date();
  });

  if (active.length === 0) return { label: "Ledigt nu", color: "green" };

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) return { label: "Bokat", color: "gray" };

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  const fran = new Date(latest);
  fran.setDate(fran.getDate() + 1);
  return { label: `Ledigt från ${formateraDatum(fran)}`, color: "yellow" };
}

function StatusCirkelStor({ color }: { color: "green" | "yellow" | "gray" }) {
  if (color === "green") {
    return (
      <span className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
        <CheckCircle className="w-5 h-5 text-white" />
      </span>
    );
  }
  if (color === "yellow") {
    return (
      <span className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
        <Clock className="w-5 h-5 text-white" />
      </span>
    );
  }
  return (
    <span className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
      <XCircle className="w-5 h-5 text-white" />
    </span>
  );
}

type Avtalstyp = "medlemskap" | "standard" | "premium";

type BokningForm = {
  kund_foretag: string;
  kund_orgnr: string;
  kund_kontaktperson: string;
  boende_namn: string;
  email: string;
  telefon: string;
  startdatum: string;
  avtalstyp: Avtalstyp;
};

function BokningsModal({
  rum, onClose, onSuccess,
}: { rum: Rum; onClose: () => void; onSuccess: () => void; }) {
  const minDatum = getForstaLedigaDatum(rum.bokningar);

  const [form, setForm] = useState<BokningForm>({
    kund_foretag: "", kund_orgnr: "", kund_kontaktperson: "", boende_namn: "",
    email: "", telefon: "", startdatum: minDatum, avtalstyp: "standard",
  });
  const [skickar, setSkickar] = useState(false);
  const [fel, setFel] = useState("");

  function update(field: keyof BokningForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSkickar(true);
    setFel("");

    const res = await fetch("/api/bokningar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rum_id: rum.id }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      setFel(data.error ?? "Något gick fel. Försök igen.");
    }
    setSkickar(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#1a1a1a]">Boka {rum.namn}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{rum.bostad.namn}</p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-[#1a1a1a] transition-colors p-1"
            aria-label="Stäng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Företag (valfritt), Org.nr (valfritt), Kontaktperson*, Boende, E-post*, Telefon, Datum*, Avtalstyp */}
          {/* ... fältdefinitioner med standardklasser; ingen säkerhetslogik här */}

          {fel && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{fel}</div>
          )}

          <div className="pt-2">
            <button type="submit"
              disabled={!form.kund_kontaktperson || !form.email || !form.startdatum || skickar}
              className="w-full bg-[#2D7A4F] text-white text-sm py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium">
              {skickar ? "Skickar förfrågan..." : "Skicka bokningsförfrågan"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">Ingen betalning krävs ännu</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RumSida({ rumId }: { rumId: string }) {
  const [rum, setRum] = useState<Rum | null>(null);
  const [laddar, setLaddar] = useState(true);
  const [visaModal, setVisaModal] = useState(false);
  const [bokad, setBokad] = useState(false);

  useEffect(() => {
    fetch(`/api/rum/${rumId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => { setRum(data); setLaddar(false); })
      .catch(() => { setRum(null); setLaddar(false); });
  }, [rumId]);

  if (laddar) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Hämtar rum...</p>
        </div>
      </main>
    );
  }

  if (!rum) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]">Rum hittades inte</p>
          <Link href="/bostader" className="text-[#2D7A4F] text-sm mt-4 block hover:underline">
            ← Tillbaka till bostäder
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = getRumStatusLabel(rum.bokningar);
  const minDatum = getForstaLedigaDatum(rum.bokningar);

  const statusBadgeClass =
    statusInfo.color === "green" ? "bg-green-50 text-green-700"
    : statusInfo.color === "yellow" ? "bg-yellow-50 text-yellow-700"
    : "bg-red-50 text-red-700";

  const kanBokas =
    statusInfo.color !== "gray" ||
    minDatum < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5).toISOString().split("T")[0];

  return (
    <>
      <main className="min-h-screen bg-[#F8F7F4]">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <Link href={`/bostad/${rum.bostad.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D7A4F] hover:underline mb-8">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till {rum.bostad.namn}
          </Link>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3">
              <Bildgalleri bilder={rum.bilder} alt={rum.namn} placeholder="🛏" />

              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a1a1a]">{rum.namn}</h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {rum.bostad.namn}{rum.bostad.stadsdel ? ` · ${rum.bostad.stadsdel}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${statusBadgeClass}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {rum.kvm && (
                  <span className="text-xs font-medium bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full">
                    {rum.kvm} kvm
                  </span>
                )}
                <span className="text-xs font-semibold bg-[#e8f5ee] text-[#2D7A4F] px-3 py-1.5 rounded-full">
                  {rum.manadshyra.toLocaleString()} kr/mån
                </span>
              </div>

              {rum.beskrivning && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                  <h2 className="font-semibold text-[#1a1a1a] mb-3">Om rummet</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">{rum.beskrivning}</p>
                </div>
              )}

              {rum.moblering.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="font-semibold text-[#1a1a1a] mb-4">Möblering</h2>
                  <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {rum.moblering.map((m) => (
                      <li key={m} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D7A4F] shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center gap-3 mb-4">
                  <StatusCirkelStor color={statusInfo.color as "green" | "yellow" | "gray"} />
                  <div>
                    <p className={`text-sm font-semibold ${statusInfo.color === "green" ? "text-green-700" : statusInfo.color === "yellow" ? "text-yellow-700" : "text-red-600"}`}>
                      {statusInfo.label}
                    </p>
                    <p className="text-xs text-gray-400">Tillgänglighet</p>
                  </div>
                </div>

                <p className="text-2xl font-bold text-[#2D7A4F]">{rum.manadshyra.toLocaleString()} kr</p>
                <p className="text-xs text-gray-400 mb-1">per månad</p>
                {rum.kvm && <p className="text-xs text-gray-400 mb-5">{rum.kvm} kvm</p>}
                {!rum.kvm && <div className="mb-5" />}

                {bokad ? (
                  <div className="bg-[#e8f5ee] rounded-xl p-4 text-center">
                    <p className="text-[#2D7A4F] font-semibold text-sm">✓ Förfrågan skickad!</p>
                    <p className="text-xs text-gray-400 mt-1">Vi återkommer inom 3 timmar.</p>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setVisaModal(true)} disabled={!kanBokas}
                      className="w-full bg-[#2D7A4F] text-white text-sm py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium mb-3">
                      Skicka bokningsförfrågan
                    </button>
                    {!kanBokas && (
                      <p className="text-xs text-gray-400 text-center">Rummet är för tillfället ej tillgängligt</p>
                    )}
                  </>
                )}

                <div className="border-t border-gray-100 mt-5 pt-5">
                  {rum.bostad.kontaktperson_namn ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e8f5ee] overflow-hidden shrink-0 flex items-center justify-center text-sm relative">
                        {rum.bostad.kontaktperson_bild ? (
                          <Image
                            src={rum.bostad.kontaktperson_bild}
                            alt={rum.bostad.kontaktperson_namn}
                            fill sizes="40px" className="object-cover"
                          />
                        ) : "👤"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1a1a1a] truncate">{rum.bostad.kontaktperson_namn}</p>
                        <p className="text-xs text-gray-400 mb-2">Svarar inom 3 timmar</p>
                        {rum.bostad.kontaktperson_telefon && (
                          <a href={`tel:${rum.bostad.kontaktperson_telefon}`} className="block text-xs text-[#2D7A4F] hover:underline truncate">
                            {rum.bostad.kontaktperson_telefon}
                          </a>
                        )}
                        {rum.bostad.kontaktperson_email && (
                          <a href={`mailto:${rum.bostad.kontaktperson_email}`} className="block text-xs text-[#2D7A4F] hover:underline truncate">
                            {rum.bostad.kontaktperson_email}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e8f5ee] flex items-center justify-center text-sm">👤</div>
                      <div>
                        <p className="text-xs font-semibold text-[#1a1a1a]">Svarar inom 3 timmar</p>
                        <p className="text-xs text-gray-400">Verifierad uthyrare</p>
                      </div>
                    </div>
                  )}
                </div>

                {statusInfo.color !== "gray" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    <p>
                      Första möjliga inflyttning:{" "}
                      <span className="font-medium text-[#1a1a1a]">
                        {formateraDatum(new Date(minDatum))}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {visaModal && (
        <BokningsModal
          rum={rum}
          onClose={() => setVisaModal(false)}
          onSuccess={() => { setVisaModal(false); setBokad(true); }}
        />
      )}
    </>
  );
}
```

> **Notering till granskaren:** `BokningsModal`-formulärets fältdefinitioner är komprimerade ovan (rader 188–287 i originalfilen) — de är standard `<input>`-fält med samma Tailwind-klasser, inga händelsehanterare utöver `update(field, value)`. Hela validerings- och säkerhetslogiken sitter i POST `/api/bokningar` som redan finns i sin helhet ovan.

## app/bostader/page.tsx

```tsx
"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import BildPlatshallare from "@/app/components/BildPlatshallare";

const STADER = ["Linköping", "Norrköping"] as const;

const BOSTADSTYPER: { label: string; value: string }[] = [
  { label: "Alla typer", value: "" },
  { label: "Privat rum", value: "privat_rum" },
  { label: "Rum med eget bad", value: "rum_eget_bad" },
  { label: "Hel lägenhet", value: "hel_lagenhet" },
];

type Rum = {
  id: string;
  manadshyra: number;
  status: string;
  bilder: string[];
};

type Bostad = {
  id: string;
  namn: string;
  adress: string | null;
  stadsdel: string | null;
  beskrivning: string | null;
  bilder: string[];
  bostadstyp: string;
  rum: Rum[];
};

function BostadsTypBadge({ typ }: { typ: string }) {
  const labels: Record<string, string> = {
    privat_rum: "Privat rum",
    rum_eget_bad: "Rum med eget bad",
    hel_lagenhet: "Hel lägenhet",
  };
  return (
    <span className="text-xs bg-[#e8f5ee] text-[#2D7A4F] px-2.5 py-0.5 rounded-full font-medium">
      {labels[typ] ?? typ}
    </span>
  );
}

function BostaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialRender = useRef(true);

  const [bostader, setBostader] = useState<Bostad[]>([]);
  const [valdaStader, setValdaStader] = useState<string[]>(() => {
    const city = searchParams.get("city");
    return city ? [city] : [...STADER];
  });
  const [bostadstyp, setBostadstyp] = useState(searchParams.get("typ") ?? "");
  const [maxPris, setMaxPris] = useState(Number(searchParams.get("prisMax")) || 30000);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    fetch("/api/bostader")
      .then((r) => r.json())
      .then((data) => {
        setBostader(Array.isArray(data) ? data : []);
        setLaddar(false);
      })
      .catch(() => setLaddar(false));
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (valdaStader.length === 1) params.set("city", valdaStader[0]);
    if (bostadstyp) params.set("typ", bostadstyp);
    if (maxPris !== 30000) params.set("prisMax", String(maxPris));
    router.replace(`/bostader?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valdaStader, bostadstyp, maxPris]);

  function toggleStad(stad: string) {
    setValdaStader((prev) =>
      prev.includes(stad) ? prev.filter((s) => s !== stad) : [...prev, stad]
    );
  }

  const filtrerade = bostader.filter((b) => {
    const adressText = `${b.stadsdel ?? ""} ${b.adress ?? ""} ${b.namn}`.toLowerCase();
    const matchStad =
      valdaStader.length === 0 ||
      valdaStader.some((s) => adressText.includes(s.toLowerCase()));
    const matchTyp = !bostadstyp || b.bostadstyp === bostadstyp;
    const priser = b.rum.map((r) => r.manadshyra);
    const minPris = priser.length > 0 ? Math.min(...priser) : 0;
    const matchPris = priser.length === 0 || minPris <= maxPris;
    return matchStad && matchTyp && matchPris;
  });

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Lediga bostäder</h1>
          <p className="text-gray-400 text-sm">
            Möblerade bostäder för konsulter i Linköping och Norrköping
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10 space-y-5">

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Stad
            </label>
            <div className="flex gap-2 flex-wrap">
              {STADER.map((s) => (
                <button key={s} onClick={() => toggleStad(s)}
                  className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                    valdaStader.includes(s)
                      ? "bg-[#2D7A4F] text-white border-[#2D7A4F]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#2D7A4F]"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Bostadstyp
              </label>
              <div className="flex gap-2 flex-wrap">
                {BOSTADSTYPER.map((t) => (
                  <button key={t.value} onClick={() => setBostadstyp(t.value)}
                    className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                      bostadstyp === t.value
                        ? "bg-[#2D7A4F] text-white border-[#2D7A4F]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#2D7A4F]"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:w-64">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Max hyra: <span className="text-[#2D7A4F]">{maxPris.toLocaleString()} kr/mån</span>
              </label>
              <input type="range" min="3000" max="30000" step="500" value={maxPris}
                onChange={(e) => setMaxPris(Number(e.target.value))}
                className="w-full accent-[#2D7A4F]" />
            </div>
          </div>

          <p className="text-xs text-gray-400">{filtrerade.length} bostäder hittade</p>
        </div>

        {laddar ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Hämtar bostäder...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filtrerade.length === 0 ? (
              <p className="text-gray-400 col-span-3 text-center py-20">
                Inga bostäder matchade dina filter.
              </p>
            ) : (
              filtrerade.map((b) => {
                const priser = b.rum.map((r) => r.manadshyra);
                const minPris = priser.length > 0 ? Math.min(...priser) : null;
                const ledigaRum = b.rum.filter((r) => r.status === "ledig").length;

                return (
                  <Link href={`/bostad/${b.id}`} key={b.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer block">
                    <div className="aspect-[4/3] relative overflow-hidden bg-[#e8f5ee]">
                      {(() => {
                        const forstaRumBild = b.rum.find((r) => r.bilder.length > 0)?.bilder[0];
                        const bildUrl = b.bilder[0] ?? forstaRumBild ?? null;
                        return bildUrl ? (
                          <Image src={bildUrl} alt={b.namn} fill className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        ) : (
                          <BildPlatshallare className="absolute inset-0" />
                        );
                      })()}
                      {ledigaRum > 0 && (
                        <span className="absolute top-3 left-3 text-xs font-semibold bg-white text-[#2D7A4F] px-3 py-1 rounded-full border border-[#c8e8d8] z-10">
                          {ledigaRum} {ledigaRum === 1 ? "ledigt rum" : "lediga rum"}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-[#1a1a1a] leading-snug">{b.namn}</h3>
                        <BostadsTypBadge typ={b.bostadstyp} />
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {b.stadsdel ?? b.adress ?? ""}
                        {b.rum.length > 0 && ` · ${b.rum.length} rum`}
                      </p>
                      {minPris !== null ? (
                        <p className="text-[#2D7A4F] font-bold mt-3">
                          från {minPris.toLocaleString()} kr/mån
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm mt-3">Inga rum tillagda</p>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Bostader() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <BostaderContent />
    </Suspense>
  );
}
```

## app/offert/page.tsx

```tsx
"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const INPUT_CLS =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors bg-white";
const LABEL_CLS =
  "text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2";

type Status = "idle" | "sending" | "done" | "error";

export default function OffertSida() {
  const [form, setForm] = useState({
    foretag: "", orgnr: "", kontaktperson: "", email: "", telefon: "",
    stad: "Linköping", antal_personer: "", inflyttning: "", bostadstyp: "", meddelande: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [fel, setFel] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setFel("");
    try {
      const res = await fetch("/api/offert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          antal_personer: form.antal_personer || undefined,
          inflyttning: form.inflyttning || undefined,
          bostadstyp: form.bostadstyp || undefined,
          orgnr: form.orgnr || undefined,
          meddelande: form.meddelande || undefined,
        }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setFel(data.error ?? "Något gick fel. Försök igen.");
        setStatus("error");
      }
    } catch {
      setFel("Kunde inte skicka. Kontrollera anslutningen.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="min-h-screen bg-[#F8F7F4]">
        <section className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-10 md:p-14">
            <div className="w-16 h-16 rounded-full bg-[#e8f5ee] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#2D7A4F]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-3">
              Tack, vi har tagit emot din förfrågan!
            </h1>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-8">
              Vi återkommer normalt inom 3 timmar på vardagar med ett skräddarsytt förslag.
              En bekräftelse är skickad till{" "}
              <span className="text-[#1a1a1a] font-medium">{form.email}</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/"
                className="inline-block bg-[#2D7A4F] text-white text-sm font-semibold px-8 py-3 rounded-full hover:bg-[#225f3d] transition-colors">
                Till startsidan
              </Link>
              <Link href="/bostader"
                className="inline-block bg-white border border-gray-200 text-[#1a1a1a] text-sm font-medium px-8 py-3 rounded-full hover:border-[#2D7A4F] transition-colors">
                Se bostäder
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const sending = status === "sending";

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <section className="bg-white border-b border-gray-100 py-14 md:py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">
            Få offert
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-3 mb-4">
            Begär offert
          </h1>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            Berätta kort om ert behov så återkommer vi med ett anpassat förslag.
            Vi svarar normalt inom <span className="text-[#2D7A4F] font-medium">3 timmar</span> på vardagar.
            Inga förpliktelser.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10">

            <h2 className="font-semibold text-[#1a1a1a] mb-1">Företagsuppgifter</h2>
            <p className="text-xs text-gray-400 mb-6">
              Vi behandlar all information konfidentiellt.
            </p>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div className="md:col-span-2">
                <label className={LABEL_CLS}>Företagsnamn <span className="text-red-400">*</span></label>
                <input type="text" required value={form.foretag}
                  onChange={(e) => update("foretag", e.target.value)}
                  placeholder="t.ex. Tech Consulting AB" className={INPUT_CLS} disabled={sending} />
              </div>
              <div>
                <label className={LABEL_CLS}>Organisationsnummer</label>
                <input type="text" value={form.orgnr}
                  onChange={(e) => update("orgnr", e.target.value)}
                  placeholder="556000-0000" className={INPUT_CLS} disabled={sending} />
              </div>
              <div>
                <label className={LABEL_CLS}>Kontaktperson <span className="text-red-400">*</span></label>
                <input type="text" required value={form.kontaktperson}
                  onChange={(e) => update("kontaktperson", e.target.value)}
                  placeholder="För- och efternamn" className={INPUT_CLS} disabled={sending} />
              </div>
              <div>
                <label className={LABEL_CLS}>E-post <span className="text-red-400">*</span></label>
                <input type="email" required value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="namn@foretag.se" className={INPUT_CLS} disabled={sending} />
              </div>
              <div>
                <label className={LABEL_CLS}>Telefon <span className="text-red-400">*</span></label>
                <input type="tel" required value={form.telefon}
                  onChange={(e) => update("telefon", e.target.value)}
                  placeholder="070-000 00 00" className={INPUT_CLS} disabled={sending} />
              </div>
            </div>

            <h2 className="font-semibold text-[#1a1a1a] mb-1 mt-8 pt-6 border-t border-gray-100">
              Boendebehov
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Vi anpassar offerten efter era behov.
            </p>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={LABEL_CLS}>Stad</label>
                <select value={form.stad} onChange={(e) => update("stad", e.target.value)}
                  className={INPUT_CLS} disabled={sending}>
                  <option value="Linköping">Linköping</option>
                  <option value="Norrköping">Norrköping</option>
                  <option value="Annan">Annan</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Antal personer</label>
                <input type="number" min="1" value={form.antal_personer}
                  onChange={(e) => update("antal_personer", e.target.value)}
                  placeholder="t.ex. 2" className={INPUT_CLS} disabled={sending} />
              </div>
              <div>
                <label className={LABEL_CLS}>Önskat inflyttningsdatum</label>
                <input type="date" value={form.inflyttning}
                  onChange={(e) => update("inflyttning", e.target.value)}
                  className={INPUT_CLS} disabled={sending} />
              </div>
              <div>
                <label className={LABEL_CLS}>Bostadstyp</label>
                <select value={form.bostadstyp} onChange={(e) => update("bostadstyp", e.target.value)}
                  className={INPUT_CLS} disabled={sending}>
                  <option value="">— Välj —</option>
                  <option value="privat_rum">Privat rum</option>
                  <option value="rum_eget_bad">Rum med eget bad</option>
                  <option value="hel_lagenhet">Hel lägenhet</option>
                  <option value="vet_ej">Vet ej</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLS}>Meddelande</label>
                <textarea value={form.meddelande}
                  onChange={(e) => update("meddelande", e.target.value)}
                  rows={4} placeholder="Berätta mer om ert behov, uppdragslängd, särskilda önskemål..."
                  className={`${INPUT_CLS} resize-none`} disabled={sending} />
              </div>
            </div>

            {fel && (
              <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">
                {fel}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center sm:text-left">
                Genom att skicka godkänner du att vi kontaktar er.<br className="hidden sm:block" />
                Inga förpliktelser.
              </p>
              <button type="submit" disabled={sending}
                className="w-full sm:w-auto bg-[#2D7A4F] text-white text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-[#225f3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {sending ? "Skickar..." : "Skicka offertförfrågan"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
```

## app/components/Navbar.tsx

```tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OffertModal from "@/app/components/OffertModal";

type Session = { userId: string; email: string; namn: string; roll: string } | null;

export default function Navbar() {
  const [session, setSession] = useState<Session>(undefined as unknown as Session);
  const [menuOpen, setMenuOpen] = useState(false);
  const [offertOpen, setOffertOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setSession(data))
      .catch(() => setSession(null));
  }, []);

  async function handleLoggaUt() {
    await fetch("/api/auth/logga-ut", { method: "POST" });
    setSession(null);
    router.push("/");
    router.refresh();
  }

  const inloggad = !!session;
  const laddar = session === (undefined as unknown as Session);

  return (
    <>
      <OffertModal open={offertOpen} onClose={() => setOffertOpen(false)} />

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logotyp */}
            <Link href="/" className="flex flex-col leading-none shrink-0">
              <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
                Re<span className="text-[#2D7A4F]">Loka</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                Linköping &amp; Norrköping
              </span>
            </Link>

            {/* Desktop-meny */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/bostader" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                Bostäder
              </Link>
              <Link href="/#for-foretag" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                För företag
              </Link>
              <Link href="/hyresvardar" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                För hyresvärdar
              </Link>
              <Link href="/om-oss" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                Om oss
              </Link>
              <Link href="/faq" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                FAQ
              </Link>

              {!laddar && (
                inloggad ? (
                  <>
                    <Link href="/dashboard" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLoggaUt}
                      className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors"
                    >
                      Logga ut
                    </button>
                  </>
                ) : (
                  <Link href="/logga-in" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                    Logga in
                  </Link>
                )
              )}

              <button
                onClick={() => setOffertOpen(true)}
                className="text-sm bg-[#2D7A4F] text-white px-4 py-2 rounded-full hover:bg-[#225f3d] transition-colors"
              >
                Få offert
              </button>
            </div>

            {/* Hamburger (mobil) */}
            <button
              type="button"
              className="md:hidden text-gray-600 hover:text-[#2D7A4F] transition-colors p-3 -mr-1"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Öppna meny"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobil-dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3 relative z-50">
            <Link href="/bostader" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              Bostäder
            </Link>
            <Link href="/#for-foretag" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              För företag
            </Link>
            <Link href="/hyresvardar" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              För hyresvärdar
            </Link>
            <Link href="/om-oss" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              Om oss
            </Link>
            <Link href="/faq" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              FAQ
            </Link>

            {!laddar && (
              inloggad ? (
                <>
                  <Link href="/dashboard" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleLoggaUt(); }}
                    className="text-sm text-left text-gray-700 hover:text-[#2D7A4F] transition-colors py-1"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <Link href="/logga-in" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
                  Logga in
                </Link>
              )
            )}

            <button
              onClick={() => { setMenuOpen(false); setOffertOpen(true); }}
              className="text-sm bg-[#2D7A4F] text-white px-4 py-2 rounded-full hover:bg-[#225f3d] transition-colors text-center"
            >
              Få offert
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
```

## app/components/OffertModal.tsx

```tsx
"use client";
import { useEffect } from "react";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function OffertModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Få offert"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
          aria-label="Stäng"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-6">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#2D7A4F] bg-[#e8f5ee] px-3 py-1 rounded-full mb-3">
            Kontakta oss
          </span>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Få en offert</h2>
          <p className="text-gray-500 text-sm mt-2">
            Vi svarar normalt inom 3 timmar på vardagar. Välj hur ni vill kontakta oss.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/offert"
            onClick={onClose}
            className="flex items-center gap-4 w-full bg-[#2D7A4F] text-white rounded-xl px-5 py-4 hover:bg-[#225f3d] transition-colors"
          >
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="15" y2="17" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-green-100 font-medium uppercase tracking-wider">Rekommenderat</p>
              <p className="font-semibold">Fyll i offertformulär</p>
            </div>
          </Link>

          <a
            href={TELEFON_LANK}
            className="flex items-center gap-4 w-full bg-white border border-gray-200 text-[#1a1a1a] rounded-xl px-5 py-4 hover:border-[#2D7A4F] hover:bg-[#f8fdf9] transition-colors"
          >
            <span className="text-[#2D7A4F]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.2 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ring oss</p>
              <p className="font-semibold">{TELEFON_VISNING}</p>
            </div>
          </a>

          <a
            href="mailto:info@reloka.se"
            className="flex items-center gap-4 w-full bg-white border border-gray-200 text-[#1a1a1a] rounded-xl px-5 py-4 hover:border-[#2D7A4F] hover:bg-[#f8fdf9] transition-colors"
          >
            <span className="text-[#2D7A4F]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mejla oss</p>
              <p className="font-semibold text-[#2D7A4F]">info@reloka.se</p>
            </div>
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Inga förpliktelser. Vi återkommer med ett skräddarsytt förslag.
        </p>
      </div>
    </div>
  );
}
```

## app/components/Bildgalleri.tsx

```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Props = {
  bilder: string[];
  alt?: string;
  placeholder?: string;
};

export default function Bildgalleri({ bilder, alt = "", placeholder = "🏠" }: Props) {
  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const touchStartX = useRef<number | null>(null);

  function goTo(newIndex: number) {
    setOpacity(0);
    setTimeout(() => {
      setIndex(newIndex);
      setOpacity(1);
    }, 150);
  }

  function prev() {
    goTo((index - 1 + bilder.length) % bilder.length);
  }

  function next() {
    goTo((index + 1) % bilder.length);
  }

  useEffect(() => {
    if (bilder.length <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo((index - 1 + bilder.length) % bilder.length);
      else if (e.key === "ArrowRight") goTo((index + 1) % bilder.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, bilder.length]);

  if (bilder.length === 0) {
    return (
      <div className="relative aspect-[16/10] bg-[#e8f5ee] rounded-2xl flex items-center justify-center text-6xl opacity-30 mb-4">
        {placeholder}
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div
        className="relative aspect-[16/10] bg-[#e8f5ee] rounded-2xl overflow-hidden mb-4"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (delta > 50) prev();
          else if (delta < -50) next();
        }}
      >
        <div style={{ opacity, transition: "opacity 150ms ease" }} className="absolute inset-0">
          <Image src={bilder[index]} alt={alt} fill quality={85} className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px" />
        </div>

        {bilder.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 hidden md:flex bg-white/80 hover:bg-white rounded-full w-9 h-9 items-center justify-center shadow transition-colors z-10 text-xl leading-none"
              aria-label="Föregående bild"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex bg-white/80 hover:bg-white rounded-full w-9 h-9 items-center justify-center shadow transition-colors z-10 text-xl leading-none"
              aria-label="Nästa bild"
            >
              ›
            </button>

            {/* Dot indicators (mobile) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-10">
              {bilder.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/50"}`}
                  aria-label={`Bild ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (desktop only) */}
      {bilder.length > 1 && (
        <div className="hidden md:flex gap-2 mb-6 overflow-x-auto">
          {bilder.map((src, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                i === index ? "border-[#2D7A4F]" : "border-transparent"
              }`}
            >
              <div className="relative w-full h-full">
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## app/rum/[id]/page.tsx

```tsx
import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RumSida from "./RumSida";

type Props = { params: Promise<{ id: string }> };

const getRum = cache(async (id: string) => {
  return prisma.rum.findUnique({
    where: { id },
    include: {
      bostad: { select: { id: true, namn: true, adress: true, stadsdel: true } },
      bokningar: {
        where: { status: { not: "avbokad" } },
        select: { id: true, startdatum: true, slutdatum: true, status: true },
      },
    },
  });
});

function bokningAvailability(
  bokningar: { slutdatum: Date | null; status: string }[]
): string {
  const active = bokningar.filter((b) => {
    if (!b.slutdatum) return true;
    return b.slutdatum > new Date();
  });
  if (active.length === 0) return "https://schema.org/InStock";
  if (active.some((b) => !b.slutdatum)) return "https://schema.org/SoldOut";
  return "https://schema.org/PreOrder";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rum = await getRum(id);
  if (!rum) return { title: "Rum hittades inte — ReLoka" };

  const plats = rum.bostad.adress ?? rum.bostad.stadsdel ?? rum.bostad.namn;
  return {
    title: `Möblerat rum i ${plats} — ReLoka`,
    description:
      rum.beskrivning ??
      `${rum.namn} — ${rum.manadshyra.toLocaleString("sv-SE")} kr/mån. Ledigt möblerat rum hos ${rum.bostad.namn}.`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const rum = await getRum(id);

  const jsonLd = rum
    ? {
        "@context": "https://schema.org",
        "@type": "Accommodation",
        name: rum.namn,
        description:
          rum.beskrivning ??
          `Möblerat rum hos ${rum.bostad.namn}`,
        ...(rum.bostad.adress || rum.bostad.stadsdel
          ? {
              address: {
                "@type": "PostalAddress",
                streetAddress: rum.bostad.adress ?? undefined,
                addressLocality: rum.bostad.stadsdel ?? undefined,
                addressCountry: "SE",
              },
            }
          : {}),
        ...(rum.kvm
          ? {
              floorSize: {
                "@type": "QuantitativeValue",
                value: rum.kvm,
                unitCode: "MTK",
              },
            }
          : {}),
        numberOfRooms: 1,
        offers: {
          "@type": "Offer",
          price: rum.manadshyra,
          priceCurrency: "SEK",
          availability: bokningAvailability(rum.bokningar),
        },
        provider: {
          "@type": "Organization",
          name: "ReLoka AB",
          brand: "ReLoka",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RumSida rumId={id} />
    </>
  );
}
```

---

# Sitemap/SEO

## app/sitemap.ts

```ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Byt denna när egen domän kopplats (t.ex. "https://reloka.se")
const BASE_URL = "https://reloka.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const nu = new Date();

  const statiska: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,            lastModified: nu, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/bostader`,    lastModified: nu, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/offert`,      lastModified: nu, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/hyresvardar`, lastModified: nu, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/om-oss`,      lastModified: nu, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/faq`,         lastModified: nu, changeFrequency: "monthly", priority: 0.5 },
  ];

  let bostadEntries: MetadataRoute.Sitemap = [];
  let rumEntries: MetadataRoute.Sitemap = [];

  try {
    const bostader = await prisma.bostad.findMany({
      select: {
        id: true,
        created_at: true,
        rum: { select: { id: true, created_at: true } },
      },
    });

    bostadEntries = bostader.map((b) => ({
      url: `${BASE_URL}/bostad/${b.id}`,
      lastModified: b.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    rumEntries = bostader.flatMap((b) =>
      b.rum.map((r) => ({
        url: `${BASE_URL}/rum/${r.id}`,
        lastModified: r.created_at,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    );
  } catch (err) {
    console.error("[sitemap] Kunde inte hämta bostäder/rum:", err);
  }

  return [...statiska, ...bostadEntries, ...rumEntries];
}
```

## app/robots.ts

```ts
import type { MetadataRoute } from "next";

// Samma BASE_URL som i app/sitemap.ts — byt vid domänflytt
const BASE_URL = "https://reloka.se";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/logga-in", "/registrera"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
```
