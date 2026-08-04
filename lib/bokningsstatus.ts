// ═══════════════════════════════════════════════════════════════════════════
// STATUSVÄRDEN FÖR BOKNINGAR — EN sanning för hela appen
//
// Alla ställen som jämför mot en bokningsstatus ska importera härifrån.
// Skriv ALDRIG "forfragan" som lös textsträng i koden igen: skrivfel och
// gamla värden går då rakt igenom utan att TypeScript säger ifrån, och då
// uppstår buggen där en flik visar (0) trots att bokningarna finns.
//
// OBS: prisma/schema.prisma har @default("forfragan") hårdkodat — Prisma kan
// inte läsa TypeScript. Ändras FORFRAGAN här måste schemat ändras med en
// migration samtidigt.
// ═══════════════════════════════════════════════════════════════════════════

export const BOKNING_STATUS = {
  FORFRAGAN: "forfragan",
  BEKRAFTAD: "bekraftad",
  AVBOKAD: "avbokad",
} as const;

export type BokningStatus = (typeof BOKNING_STATUS)[keyof typeof BOKNING_STATUS];

// I den ordning en bokning normalt rör sig.
export const BOKNING_STATUSAR = [
  BOKNING_STATUS.FORFRAGAN,
  BOKNING_STATUS.BEKRAFTAD,
  BOKNING_STATUS.AVBOKAD,
] as const;

// Databasen är bara text — det kan ligga värden där som koden inte känner
// till (t.ex. "aktiv" från maj 2026, innan statusorden var satta). Använd
// den här för att upptäcka dem i stället för att tyst behandla dem som något.
export function arBokningStatus(varde: string): varde is BokningStatus {
  return (BOKNING_STATUSAR as readonly string[]).includes(varde);
}

export const BOKNING_STATUS_ETIKETT: Record<BokningStatus, string> = {
  [BOKNING_STATUS.FORFRAGAN]: "Förfrågan",
  [BOKNING_STATUS.BEKRAFTAD]: "Bekräftad",
  [BOKNING_STATUS.AVBOKAD]: "Avbokad",
};

// ─── Kontraktstatus ──────────────────────────────────────────────────────────

export const KONTRAKT_STATUS = {
  SAKNAS: "saknas",
  UPPLADDAT: "uppladdat",
  SKICKAT: "skickat",
  SIGNERAT: "signerat",
} as const;

export type KontraktStatus = (typeof KONTRAKT_STATUS)[keyof typeof KONTRAKT_STATUS];

export const KONTRAKT_STATUSAR = [
  KONTRAKT_STATUS.SAKNAS,
  KONTRAKT_STATUS.UPPLADDAT,
  KONTRAKT_STATUS.SKICKAT,
  KONTRAKT_STATUS.SIGNERAT,
] as const;

// ─── Fakturastatus ───────────────────────────────────────────────────────────

export const FAKTURA_STATUS = {
  EJ_FAKTURERAD: "ej_fakturerad",
  FAKTURERAD: "fakturerad",
  BETALD: "betald",
} as const;

export type FakturaStatus = (typeof FAKTURA_STATUS)[keyof typeof FAKTURA_STATUS];

export const FAKTURA_STATUSAR = [
  FAKTURA_STATUS.EJ_FAKTURERAD,
  FAKTURA_STATUS.FAKTURERAD,
  FAKTURA_STATUS.BETALD,
] as const;
