import { z } from "zod";
import { TELEFON_REGEX, TELEFON_FELTEXT } from "@/lib/telefon";

// ─── Zod-scheman för alla skrivande endpoints ────────────────────────────────
// Felmeddelandena visas direkt för användaren i formulären — håll dem svenska
// och begripliga. Maxlängder skyddar databasen mot skräpdata.

// Formulär skickar ofta tomma strängar för valfria fält — normalisera till undefined
const tomBlirUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

function valfriText(max: number) {
  return z.preprocess(
    tomBlirUndefined,
    z.string().trim().max(max, `Får vara högst ${max} tecken`).optional()
  );
}

const epost = z
  .string({ error: "Ange en giltig e-postadress" })
  .trim()
  .toLowerCase()
  .max(254, "E-postadressen är för lång")
  .pipe(z.email({ error: "Ange en giltig e-postadress" }));

const telefonKravs = z
  .string({ error: TELEFON_FELTEXT })
  .trim()
  .regex(TELEFON_REGEX, TELEFON_FELTEXT);

const telefonValfri = z.preprocess(
  tomBlirUndefined,
  z.string().trim().regex(TELEFON_REGEX, TELEFON_FELTEXT).optional()
);

const bildLista = z.array(z.string().max(1000)).max(30, "Högst 30 bilder").optional();

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registreraSchema = z.object({
  namn: z.string({ error: "Namn krävs" }).trim().min(1, "Namn krävs").max(100, "Namnet är för långt"),
  email: epost,
  losenord: z
    .string({ error: "Lösenord krävs" })
    .min(8, "Lösenordet måste vara minst 8 tecken")
    .max(200, "Lösenordet är för långt"),
});

export const loggaInSchema = z.object({
  // Lowercase här måste matcha registreringen (epost-schemat) — annars kan
  // konton skapade med versaler aldrig logga in
  email: z.string({ error: "E-post och lösenord krävs" }).trim().toLowerCase().min(1, "E-post och lösenord krävs").max(254),
  losenord: z.string({ error: "E-post och lösenord krävs" }).min(1, "E-post och lösenord krävs").max(200),
});

export const bytLosenordSchema = z.object({
  nuvarandeLosenord: z
    .string({ error: "Både nuvarande och nytt lösenord krävs" })
    .min(1, "Både nuvarande och nytt lösenord krävs")
    .max(200),
  nyttLosenord: z
    .string({ error: "Både nuvarande och nytt lösenord krävs" })
    .min(8, "Det nya lösenordet måste vara minst 8 tecken")
    .max(200, "Lösenordet är för långt"),
});

// ─── Publika formulär ────────────────────────────────────────────────────────

export const bokningSchema = z.object({
  rum_id: z.string({ error: "rum_id krävs" }).trim().min(1, "rum_id krävs").max(100),
  kund_foretag: valfriText(200),
  kund_orgnr: valfriText(20),
  kund_kontaktperson: z
    .string({ error: "Kontaktperson krävs" })
    .trim()
    .min(1, "Kontaktperson krävs")
    .max(200, "Namnet är för långt"),
  boende_namn: valfriText(200),
  email: epost,
  telefon: telefonValfri,
  startdatum: z.string({ error: "Startdatum krävs" }).trim().min(1, "Startdatum krävs").max(30),
  avtalstyp: z.preprocess(
    tomBlirUndefined,
    z.enum(["standard", "premium", "medlemskap"], { error: "Ogiltig avtalstyp" }).optional()
  ),
});

export const offertSchema = z.object({
  foretag: z.string({ error: "Företagsnamn krävs" }).trim().min(1, "Företagsnamn krävs").max(200, "Företagsnamnet är för långt"),
  orgnr: valfriText(20),
  kontaktperson: z.string({ error: "Kontaktperson krävs" }).trim().min(1, "Kontaktperson krävs").max(200),
  email: epost,
  telefon: telefonKravs,
  stad: z.string({ error: "Stad krävs" }).trim().min(1, "Stad krävs").max(100),
  antal_personer: z.preprocess(
    tomBlirUndefined,
    z.coerce.number({ error: "Ogiltigt antal personer" }).int().positive().max(500).optional()
  ),
  inflyttning: valfriText(30),
  bostadstyp: z.preprocess(
    tomBlirUndefined,
    z.enum(["privat_rum", "rum_eget_bad", "hel_lagenhet", "vet_ej"], { error: "Ogiltig bostadstyp" }).optional()
  ),
  meddelande: valfriText(5000),
});

export const hyresvardSchema = z.object({
  namn: z.string({ error: "Namn krävs" }).trim().min(1, "Namn krävs").max(200),
  telefon: telefonValfri,
  email: epost,
  stad: valfriText(100),
  adress: valfriText(300),
  meddelande: valfriText(5000),
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const bostadSchema = z.object({
  namn: z.string({ error: "Namn krävs" }).trim().min(1, "Namn krävs").max(200),
  adress: valfriText(300),
  stadsdel: valfriText(100),
  bostadstyp: z.preprocess(
    tomBlirUndefined,
    z.enum(["privat_rum", "rum_eget_bad", "hel_lagenhet"]).optional()
  ),
  beskrivning: valfriText(5000),
  bilder: bildLista,
  delade_utrymmen: z.array(z.string().max(100)).max(50).optional(),
  inkluderat: z.array(z.string().max(100)).max(50).optional(),
  kontaktperson_namn: valfriText(200),
  kontaktperson_bild: valfriText(1000),
  kontaktperson_email: z.preprocess(tomBlirUndefined, epost.optional()),
  kontaktperson_telefon: telefonValfri,
});

export const rumSchema = z.object({
  bostad_id: z.string({ error: "bostad_id krävs" }).trim().min(1, "bostad_id krävs").max(100),
  namn: z.string({ error: "Namn krävs" }).trim().min(1, "Namn krävs").max(200),
  beskrivning: valfriText(5000),
  bilder: bildLista,
  kvm: z.preprocess(
    tomBlirUndefined,
    z.coerce.number({ error: "Ogiltig kvm" }).int().positive().max(1000).optional()
  ),
  manadshyra: z.coerce
    .number({ error: "Ogiltig månadshyra" })
    .int("Månadshyran måste vara ett heltal")
    .positive("Månadshyran måste vara större än 0")
    .max(1_000_000),
  moblering: z.array(z.string().max(100)).max(50).optional(),
});

export const bokningPatchSchema = z
  .object({
    status: z.enum(["forfragan", "bekraftad", "avbokad"], {
      error: "status måste vara en av: forfragan, bekraftad, avbokad",
    }).optional(),
    slutdatum: z.string().trim().max(30).nullable().optional(),
    kontrakt_status: z.enum(["saknas", "uppladdat", "skickat", "signerat"], {
      error: "kontrakt_status måste vara en av: saknas, uppladdat, skickat, signerat",
    }).optional(),
    faktura_status: z.enum(["ej_fakturerad", "fakturerad", "betald"], {
      error: "faktura_status måste vara en av: ej_fakturerad, fakturerad, betald",
    }).optional(),
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.slutdatum !== undefined ||
      d.kontrakt_status !== undefined ||
      d.faktura_status !== undefined,
    { error: "Ange minst ett fält att uppdatera" }
  );

// Lead-uppföljning: status och/eller intern anteckning (admin)
const internNotering = z
  .string()
  .max(2000, "Anteckningen får vara högst 2000 tecken")
  .nullable()
  .optional();

export const offertPatchSchema = z
  .object({
    status: z
      .enum(["obehandlad", "kontaktad", "offert_skickad", "vunnen", "forlorad"], {
        error: "Ogiltig status",
      })
      .optional(),
    intern_notering: internNotering,
  })
  .refine((d) => d.status !== undefined || d.intern_notering !== undefined, {
    error: "Ange status och/eller intern anteckning",
  });

export const hyresvardPatchSchema = z
  .object({
    status: z
      .enum(["obehandlad", "kontaktad", "pagaende", "avtal_klart", "ej_aktuell"], {
        error: "Ogiltig status",
      })
      .optional(),
    intern_notering: internNotering,
  })
  .refine((d) => d.status !== undefined || d.intern_notering !== undefined, {
    error: "Ange status och/eller intern anteckning",
  });

// ─── Hjälpare ────────────────────────────────────────────────────────────────

type ValideringsResultat<T> = { ok: true; data: T } | { ok: false; svar: Response };

/**
 * Validerar body mot ett schema. Vid fel: färdigt 400-svar med första
 * felmeddelandet (visas direkt i formulären).
 */
export function validera<T>(schema: z.ZodType<T>, body: unknown): ValideringsResultat<T> {
  const resultat = schema.safeParse(body);
  if (!resultat.success) {
    const forsta = resultat.error.issues[0];
    return {
      ok: false,
      svar: Response.json(
        { error: forsta?.message ?? "Ogiltig indata" },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: resultat.data };
}

/** Läser JSON-body; trasig/tom JSON ger 400 istället för 500 */
export async function lasJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; svar: Response }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return {
      ok: false,
      svar: Response.json({ error: "Ogiltig JSON i anropet" }, { status: 400 }),
    };
  }
}
