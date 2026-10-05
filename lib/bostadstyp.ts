// ═══════════════════════════════════════════════════════════════════════════
// BOSTADSTYPER — EN sanning för Bostad.bostadstyp och Rum.bostadstyp
//
// Typen ligger per rum: samma hus kan ha både rum som delar badrum och rum
// med eget badrum (och en hel lägenhet i ett gårdshus). Bostad.bostadstyp
// finns kvar som reserv för bostäder som ännu saknar rum.
//
// OBS: prisma/schema.prisma har @default("privat_rum") hårdkodat på både
// Bostad och Rum — Prisma kan inte läsa TypeScript. Ändras defaulten här
// måste schemat ändras med en migration samtidigt.
// ═══════════════════════════════════════════════════════════════════════════

export const BOSTADSTYPER = ["privat_rum", "rum_eget_bad", "hel_lagenhet"] as const;

export type Bostadstyp = (typeof BOSTADSTYPER)[number];

export const STANDARD_BOSTADSTYP: Bostadstyp = "privat_rum";

// Databasen är bara text — okända värden visas som de är i stället för att
// tyst behandlas som någon av typerna.
export function arBostadstyp(varde: string): varde is Bostadstyp {
  return (BOSTADSTYPER as readonly string[]).includes(varde);
}

// Filtret och typmärkena på /bostader och bostadssidan
const BOSTADSTYP_ETIKETT: Record<Bostadstyp, string> = {
  privat_rum: "Privat rum",
  rum_eget_bad: "Rum med eget bad",
  hel_lagenhet: "Hel lägenhet",
};

// Rumskorten: det besökaren jämför mellan rummen i samma hus är badrummet
const RUMSTYP_ETIKETT: Record<Bostadstyp, string> = {
  privat_rum: "Delat badrum",
  rum_eget_bad: "Eget badrum",
  hel_lagenhet: "Hel lägenhet",
};

export function bostadstypEtikett(typ: string): string {
  return arBostadstyp(typ) ? BOSTADSTYP_ETIKETT[typ] : typ;
}

export function rumstypEtikett(typ: string): string {
  return arBostadstyp(typ) ? RUMSTYP_ETIKETT[typ] : typ;
}

type MedTyper = { bostadstyp: string; rum: { bostadstyp: string }[] };

/**
 * Typerna som finns bland bostadens rum, i fast ordning (BOSTADSTYPER).
 * Har bostaden inga rum används bostadens egen typ.
 */
export function bostadensTyper(bostad: MedTyper): string[] {
  const typer = new Set(
    bostad.rum.length > 0 ? bostad.rum.map((r) => r.bostadstyp) : [bostad.bostadstyp]
  );
  const ordning = (t: string) => {
    const i = (BOSTADSTYPER as readonly string[]).indexOf(t);
    return i === -1 ? BOSTADSTYPER.length : i;
  };
  return [...typer].sort((a, b) => ordning(a) - ordning(b));
}

/** Filtret på /bostader: bostaden själv ELLER något av dess rum har typen. */
export function matcharBostadstyp(bostad: MedTyper, typ: string): boolean {
  return bostad.bostadstyp === typ || bostad.rum.some((r) => r.bostadstyp === typ);
}
