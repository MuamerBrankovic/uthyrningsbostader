// Typer som delas mellan dashboardens sidor och komponenter.
// (En "typ" beskriver bara vilka fält datan har — ingen logik här.)

export type RumInfo = {
  id: string;
  namn: string;
  manadshyra: number;
  bostad: { id: string; namn: string; stadsdel: string | null };
};

// En bokning så som admin ser den — med kontakt-, kontrakts- och fakturafält
// som vanliga användare inte får ut ur API:t.
export type AdminBokning = {
  id: string;
  kund_foretag: string | null;
  kund_orgnr: string | null;
  kund_kontaktperson: string;
  boende_namn: string | null;
  email: string;
  telefon: string | null;
  startdatum: string;
  slutdatum: string | null;
  status: string;
  avtalstyp: string;
  kontrakt_url: string | null;
  kontrakt_status: string;
  kontrakt_uppdaterad: string | null;
  faktura_status: string;
  created_at: string;
  rum: RumInfo;
};
