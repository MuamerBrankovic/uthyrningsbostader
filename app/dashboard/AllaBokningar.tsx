"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { formateraDatum } from "@/lib/datum";
import type { AdminBokning } from "./typer";
import {
  BOKNING_STATUS,
  BOKNING_STATUS_ETIKETT,
  KONTRAKT_STATUS,
  FAKTURA_STATUS,
  arBokningStatus,
} from "@/lib/bokningsstatus";

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN-VYN "ALLA BOKNINGAR"
//
// Vyn hämtar alla bokningar en gång och gör sedan ALLT arbete här i webb-
// läsaren: underflikar, sökning och sortering. Inga extra anrop till servern,
// så det går lika snabbt med 500 bokningar som med 5.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Vad en bokning saknar ───────────────────────────────────────────────────
//
// Returnerar en lista med det som återstår att göra. Tom lista = inget att
// göra. Används på två ställen: fliken "Kräver åtgärd" och raden
// "Behöver: ..." på korten — så de kan aldrig säga emot varandra.
function saknasFor(b: AdminBokning): string[] {
  // Status är fritext i databasen. Ligger det ett värde där som koden inte
  // känner igen ska det SYNAS — inte tyst behandlas som något annat. Annars
  // försvinner bokningen ur alla arbetsflikar utan att någon märker det.
  if (!arBokningStatus(b.status)) return [`okänd status (${b.status})`];

  // En obesvarad förfrågan är i sig en åtgärd.
  if (b.status === BOKNING_STATUS.FORFRAGAN) return ["svar på förfrågan"];

  // Avbokade bokningar kräver ingenting.
  if (b.status !== BOKNING_STATUS.BEKRAFTAD) return [];

  const kvar: string[] = [];
  if (b.kontrakt_status === KONTRAKT_STATUS.SAKNAS) kvar.push("kontrakt");
  if (b.faktura_status === FAKTURA_STATUS.EJ_FAKTURERAD) kvar.push("fakturering");
  return kvar;
}

// ─── Underflikar ─────────────────────────────────────────────────────────────
//
// SÅ HÄR LÄGGER DU TILL EN NY UNDERFLIK:
// Lägg till en rad i listan nedan. Varje rad har tre delar:
//
//   key    — internt namn. Måste vara unikt, syns aldrig för användaren.
//   label  — texten som står i flikraden.
//   urval  — vilka bokningar fliken ska visa. Skrivs som en rad som svarar
//            ja/nej för EN bokning, t.ex.:
//              urval: (b) => b.status === BOKNING_STATUS.AVBOKAD
//            Jämför ALLTID mot BOKNING_STATUS (lib/bokningsstatus.ts), aldrig
//            mot en egen textsträng — då kan ett skrivfel göra att fliken
//            visar (0) trots att bokningarna finns.
//            Vill du ha alla: urval: () => true
//
// Ordningen i listan är ordningen i flikraden, och den FÖRSTA fliken är den
// som visas när man öppnar "Alla bokningar".
// Antalet i etiketten räknas ut automatiskt — inget att fylla i.

type Underflik = {
  key: string;
  label: string;
  urval: (b: AdminBokning) => boolean;
};

const UNDERFLIKAR: Underflik[] = [
  { key: "atgard", label: "Kräver åtgärd", urval: (b) => saknasFor(b).length > 0 },
  { key: "forfragan", label: "Förfrågningar", urval: (b) => b.status === BOKNING_STATUS.FORFRAGAN },
  { key: "bekraftad", label: "Bekräftade", urval: (b) => b.status === BOKNING_STATUS.BEKRAFTAD },
  { key: "avbokad", label: "Avbokade", urval: (b) => b.status === BOKNING_STATUS.AVBOKAD },
  { key: "alla", label: "Alla", urval: () => true },
];

// ─── Sortering ───────────────────────────────────────────────────────────────
// Ny sorteringsordning? Lägg till en rad här och ett fall i jamfor() nedan.
const SORTERINGAR = [
  { key: "nyast", label: "Nyast först" },
  { key: "aldst", label: "Äldst först" },
  { key: "startdatum", label: "Startdatum" },
];

function jamfor(sortering: string) {
  const tid = (s: string) => new Date(s).getTime();
  if (sortering === "aldst") {
    return (a: AdminBokning, b: AdminBokning) => tid(a.created_at) - tid(b.created_at);
  }
  if (sortering === "startdatum") {
    return (a: AdminBokning, b: AdminBokning) => tid(a.startdatum) - tid(b.startdatum);
  }
  // Standard: nyast först
  return (a: AdminBokning, b: AdminBokning) => tid(b.created_at) - tid(a.created_at);
}

// ─── Sökning ─────────────────────────────────────────────────────────────────
// Fälten sökrutan letar i. Vill du söka i fler fält: lägg till dem i listan.
function sokText(b: AdminBokning): string {
  return [
    b.kund_foretag,
    b.kund_kontaktperson,
    b.email,
    b.boende_namn,
    b.rum?.namn,
    b.rum?.bostad?.namn,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// ─── Status-etiketter ────────────────────────────────────────────────────────
// Ett ställe per statustyp, så sammanfattningsraden och detaljerna alltid
// visar samma text och färg.

const BOKNING_STIL: Record<string, { cls: string; label: string }> = {
  [BOKNING_STATUS.BEKRAFTAD]: { cls: "bg-green-100 text-green-700", label: BOKNING_STATUS_ETIKETT.bekraftad },
  [BOKNING_STATUS.AVBOKAD]: { cls: "bg-gray-100 text-gray-500", label: BOKNING_STATUS_ETIKETT.avbokad },
  [BOKNING_STATUS.FORFRAGAN]: { cls: "bg-yellow-100 text-yellow-700", label: BOKNING_STATUS_ETIKETT.forfragan },
};

const KONTRAKT_STIL: Record<string, { cls: string; label: string }> = {
  [KONTRAKT_STATUS.SAKNAS]: { cls: "bg-gray-100 text-gray-500", label: "Saknas" },
  [KONTRAKT_STATUS.UPPLADDAT]: { cls: "bg-blue-100 text-blue-700", label: "Uppladdat" },
  [KONTRAKT_STATUS.SKICKAT]: { cls: "bg-yellow-100 text-yellow-700", label: "Skickat" },
  [KONTRAKT_STATUS.SIGNERAT]: { cls: "bg-green-100 text-green-700", label: "Signerat" },
};

const FAKTURA_STIL: Record<string, { cls: string; label: string }> = {
  [FAKTURA_STATUS.EJ_FAKTURERAD]: { cls: "bg-gray-100 text-gray-500", label: "Ej fakturerad" },
  [FAKTURA_STATUS.FAKTURERAD]: { cls: "bg-yellow-100 text-yellow-700", label: "Fakturerad" },
  [FAKTURA_STATUS.BETALD]: { cls: "bg-green-100 text-green-700", label: "Betald" },
};

// Okänt värde i databasen visas som sig självt, i en avvikande färg. Tidigare
// föll den här funktionen tillbaka på "Förfrågan", vilket fick en bokning med
// status "aktiv" att SE UT som en förfrågan trots att flikfiltret inte
// matchade den — data och etikett sa emot varandra utan att någon såg det.
function Badge({
  stilar,
  status,
}: {
  stilar: Record<string, { cls: string; label: string }>;
  status: string;
}) {
  const s = stilar[status];
  if (!s) {
    return (
      <span
        className="text-xs px-3 py-1 rounded-full font-medium bg-amber-100 text-amber-800"
        title="Värdet finns inte bland de giltiga statusarna — se lib/bokningsstatus.ts"
      >
        Okänd status: {status}
      </span>
    );
  }
  return <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

function BokningStatusBadge({ status }: { status: string }) {
  return <Badge stilar={BOKNING_STIL} status={status} />;
}

function KontraktStatusBadge({ status }: { status: string }) {
  return <Badge stilar={KONTRAKT_STIL} status={status} />;
}

function FakturaStatusBadge({ status }: { status: string }) {
  return <Badge stilar={FAKTURA_STIL} status={status} />;
}

// Liten variant för sammanfattningsraden — med etikett framför, så man ser
// vad siffran gäller utan att öppna kortet.
function MiniIndikator({
  etikett,
  stilar,
  status,
}: {
  etikett: string;
  stilar: Record<string, { cls: string; label: string }>;
  status: string;
}) {
  const s = stilar[status];
  return (
    <span
      className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
        s ? s.cls : "bg-amber-100 text-amber-800"
      }`}
    >
      {etikett}: {s ? s.label.toLowerCase() : `okänt (${status})`}
    </span>
  );
}

const SELECT_LITEN_CLS =
  "border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#2D7A4F] bg-white";

// ─── Detaljrad ───────────────────────────────────────────────────────────────

function Detalj({ label, varde }: { label: string; varde: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
        {label}
      </p>
      <p className="text-sm text-[#1a1a1a] break-words">{varde}</p>
    </div>
  );
}

// ─── Kontrakt + fakturering (oförändrad funktionalitet) ──────────────────────

function KontraktSektion({
  bokning,
  arbetar,
  onPatch,
  onUppladdat,
}: {
  bokning: AdminBokning;
  arbetar: boolean;
  onPatch: (data: { kontrakt_status?: string; faktura_status?: string }) => void;
  onUppladdat: (partial: Partial<AdminBokning>) => void;
}) {
  const filRef = useRef<HTMLInputElement>(null);
  const [laddarUpp, setLaddarUpp] = useState(false);
  const [uploadFel, setUploadFel] = useState("");

  async function laddaUpp(fil: File) {
    setLaddarUpp(true);
    setUploadFel("");
    const fd = new FormData();
    fd.append("file", fil);
    fd.append("bokning_id", bokning.id);
    try {
      const res = await fetch("/api/kontrakt", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        onUppladdat(data);
      } else {
        setUploadFel(data?.error ?? "Uppladdningen misslyckades");
      }
    } catch {
      setUploadFel("Uppladdningen misslyckades");
    }
    setLaddarUpp(false);
  }

  const upptagen = arbetar || laddarUpp;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-x-6 gap-y-4">
      {/* ── Kontrakt ── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Kontrakt
          </span>
          <KontraktStatusBadge status={bokning.kontrakt_status} />
          {bokning.kontrakt_uppdaterad && (
            <span className="text-xs text-gray-400">
              {formateraDatum(bokning.kontrakt_uppdaterad)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={filRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const fil = e.target.files?.[0];
              if (fil) laddaUpp(fil);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => filRef.current?.click()}
            disabled={upptagen}
            className="text-xs bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-full hover:border-[#2D7A4F] hover:text-[#2D7A4F] transition-colors disabled:opacity-40 font-medium"
          >
            {laddarUpp ? "Laddar upp..." : bokning.kontrakt_url ? "Ersätt PDF" : "Ladda upp PDF"}
          </button>
          {bokning.kontrakt_url && (
            <a
              href={bokning.kontrakt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2D7A4F] hover:underline font-medium"
            >
              Visa kontrakt
            </a>
          )}
          <select
            value={bokning.kontrakt_status}
            onChange={(e) => onPatch({ kontrakt_status: e.target.value })}
            disabled={upptagen}
            className={SELECT_LITEN_CLS}
            aria-label="Kontraktstatus"
          >
            <option value={KONTRAKT_STATUS.SAKNAS}>Saknas</option>
            <option value={KONTRAKT_STATUS.UPPLADDAT}>Uppladdat</option>
            <option value={KONTRAKT_STATUS.SKICKAT}>Skickat</option>
            <option value={KONTRAKT_STATUS.SIGNERAT}>Signerat</option>
          </select>
        </div>
        <div className="mt-2">
          <button
            disabled
            title="Scrive-integration kommer snart"
            className="text-xs bg-gray-50 border border-gray-100 text-gray-300 px-4 py-1.5 rounded-full cursor-not-allowed font-medium"
          >
            Skicka för e-signering
          </button>
          <span className="text-xs text-gray-400 ml-2">Scrive-integration kommer snart</span>
        </div>
        {uploadFel && <p className="text-xs text-red-500 mt-2">{uploadFel}</p>}
      </div>

      {/* ── Fakturering ── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Fakturering
          </span>
          <FakturaStatusBadge status={bokning.faktura_status} />
        </div>
        {bokning.status === BOKNING_STATUS.BEKRAFTAD ? (
          <>
            <select
              value={bokning.faktura_status}
              onChange={(e) => onPatch({ faktura_status: e.target.value })}
              disabled={upptagen}
              className={SELECT_LITEN_CLS}
              aria-label="Fakturastatus"
            >
              <option value={FAKTURA_STATUS.EJ_FAKTURERAD}>Ej fakturerad</option>
              <option value={FAKTURA_STATUS.FAKTURERAD}>Fakturerad</option>
              <option value={FAKTURA_STATUS.BETALD}>Betald</option>
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Fakturering sker manuellt. Integration med bokföringssystem (Fortnox/Bokio) planeras.
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400">Faktureras efter att bokningen bekräftats.</p>
        )}
      </div>
    </div>
  );
}

// ─── Ett bokningskort ────────────────────────────────────────────────────────

function BokningsKort({
  b,
  oppen,
  arbetar,
  slutdatum,
  onVaxlaOppen,
  onSlutdatumChange,
  onUppdatera,
  onUppladdat,
}: {
  b: AdminBokning;
  oppen: boolean;
  arbetar: boolean;
  slutdatum: string;
  onVaxlaOppen: () => void;
  onSlutdatumChange: (v: string) => void;
  onUppdatera: (data: {
    status?: string;
    slutdatum?: string | null;
    kontrakt_status?: string;
    faktura_status?: string;
  }) => void;
  onUppladdat: (partial: Partial<AdminBokning>) => void;
}) {
  const behover = saknasFor(b);
  // Företaget är det man känner igen bokningen på — saknas det tar vi personen.
  const titel = b.kund_foretag ?? b.kund_kontaktperson;
  const detaljerId = `bokning-detaljer-${b.id}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* ── Sammanfattning: hela raden är knappen som fäller ut kortet ── */}
      <button
        type="button"
        onClick={onVaxlaOppen}
        aria-expanded={oppen}
        aria-controls={detaljerId}
        className="w-full text-left p-4 md:p-5 hover:bg-[#F8F7F4] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[#1a1a1a] text-base">{titel}</h3>
              <BokningStatusBadge status={b.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {b.rum?.namn} · {b.rum?.bostad?.namn}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formateraDatum(b.startdatum)} –{" "}
              {b.slutdatum ? formateraDatum(b.slutdatum) : "tills vidare"}
            </p>
            {behover.length > 0 && (
              <p className="text-xs font-semibold text-[#2D7A4F] mt-2">
                Behöver: {behover.join(", ")}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <MiniIndikator
              etikett="Kontrakt"
              stilar={KONTRAKT_STIL}
              status={b.kontrakt_status}
            />
            <MiniIndikator
              etikett="Faktura"
              stilar={FAKTURA_STIL}
              status={b.faktura_status}
            />
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D7A4F] mt-3">
          {oppen ? "Dölj detaljer" : "Visa detaljer"}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
            className={`transition-transform ${oppen ? "rotate-180" : ""}`}
          >
            <polyline points="1,3 5,7 9,3" />
          </svg>
        </span>
      </button>

      {/* ── Detaljer ── */}
      {oppen && (
        <div id={detaljerId} className="px-4 md:px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <Detalj label="Kontaktperson" varde={b.kund_kontaktperson} />
            <Detalj
              label="E-post"
              varde={
                <a href={`mailto:${b.email}`} className="text-[#2D7A4F] hover:underline">
                  {b.email}
                </a>
              }
            />
            <Detalj
              label="Telefon"
              varde={
                b.telefon ? (
                  <a href={`tel:${b.telefon}`} className="text-[#2D7A4F] hover:underline">
                    {b.telefon}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Detalj label="Org.nr" varde={b.kund_orgnr ?? "—"} />
            <Detalj label="Boende" varde={b.boende_namn ?? "—"} />
            <Detalj
              label="Avtalstyp"
              varde={
                b.avtalstyp === "premium"
                  ? "Premium"
                  : b.avtalstyp === "medlemskap"
                    ? "Medlemskap"
                    : "Standard"
              }
            />
            <Detalj
              label="Hyra"
              varde={`${b.rum?.manadshyra?.toLocaleString()} kr/mån`}
            />
            <Detalj label="Inkom" varde={formateraDatum(b.created_at)} />
          </div>

          {/* ── Åtgärder ── */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
            {b.status === BOKNING_STATUS.FORFRAGAN && (
              <button
                onClick={() => onUppdatera({ status: BOKNING_STATUS.BEKRAFTAD })}
                disabled={arbetar}
                className="text-sm bg-[#2D7A4F] text-white px-5 py-2 rounded-full hover:bg-[#225f3d] transition-colors disabled:opacity-40 font-medium"
              >
                {arbetar ? "Sparar..." : "Bekräfta"}
              </button>
            )}
            {b.status !== BOKNING_STATUS.AVBOKAD && (
              <button
                onClick={() => {
                  if (confirm("Avboka denna bokning?")) {
                    onUppdatera({ status: BOKNING_STATUS.AVBOKAD });
                  }
                }}
                disabled={arbetar}
                className="text-sm bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-full hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40 font-medium"
              >
                Avboka
              </button>
            )}
            {b.status === BOKNING_STATUS.BEKRAFTAD && (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="date"
                  value={slutdatum}
                  onChange={(e) => onSlutdatumChange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#2D7A4F]"
                  disabled={arbetar}
                  aria-label="Nytt slutdatum"
                />
                <button
                  onClick={() => onUppdatera({ slutdatum: slutdatum || null })}
                  disabled={arbetar || !slutdatum}
                  className="text-sm bg-white border border-gray-200 text-[#2D7A4F] px-4 py-1.5 rounded-full hover:border-[#2D7A4F] transition-colors disabled:opacity-40 font-medium"
                >
                  Sätt slutdatum
                </button>
              </div>
            )}
          </div>

          <KontraktSektion
            bokning={b}
            arbetar={arbetar}
            onPatch={(data) => onUppdatera(data)}
            onUppladdat={onUppladdat}
          />
        </div>
      )}
    </div>
  );
}

// ─── Huvudvy ─────────────────────────────────────────────────────────────────

export default function AllaBokningar() {
  const [bokningar, setBokningar] = useState<AdminBokning[]>([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState("");
  const [uppdaterarId, setUppdaterarId] = useState<string | null>(null);
  const [slutdatumInput, setSlutdatumInput] = useState<Record<string, string>>({});

  // Vyns eget läge: vald flik, sökord, sortering och vilka kort som är utfällda.
  const [aktivUnderflik, setAktivUnderflik] = useState<string>(UNDERFLIKAR[0].key);
  const [sokord, setSokord] = useState("");
  const [sortering, setSortering] = useState<string>(SORTERINGAR[0].key);
  // Flera kort får vara öppna samtidigt — man jobbar ofta igenom en hel hög.
  const [oppnaKort, setOppnaKort] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/bokningar?alla=1")
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          setFel(data.error ?? "Kunde inte hämta bokningar");
          return [];
        }
        return r.json();
      })
      .then((data) => {
        setBokningar(Array.isArray(data) ? data : []);
        setLaddar(false);
      })
      .catch(() => {
        setFel("Kunde inte hämta bokningar");
        setLaddar(false);
      });
  }, []);

  async function uppdatera(
    id: string,
    data: {
      status?: string;
      slutdatum?: string | null;
      kontrakt_status?: string;
      faktura_status?: string;
    }
  ) {
    setUppdaterarId(id);
    setFel("");
    try {
      const res = await fetch(`/api/bokningar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const svar = await res.json().catch(() => null);
      if (res.ok && svar) {
        setBokningar((prev) => prev.map((b) => (b.id === id ? { ...b, ...svar } : b)));
      } else {
        setFel(svar?.error ?? "Kunde inte uppdatera bokningen");
      }
    } catch {
      setFel("Kunde inte uppdatera bokningen");
    }
    setUppdaterarId(null);
  }

  function vaxlaKort(id: string) {
    setOppnaKort((prev) => {
      const nasta = new Set(prev);
      if (nasta.has(id)) nasta.delete(id);
      else nasta.add(id);
      return nasta;
    });
  }

  // Antal per flik — räknas på HELA listan, inte på sökresultatet, så
  // siffrorna står stilla medan man söker.
  const antalPerFlik = useMemo(() => {
    const rakning: Record<string, number> = {};
    for (const f of UNDERFLIKAR) rakning[f.key] = bokningar.filter(f.urval).length;
    return rakning;
  }, [bokningar]);

  const flik = UNDERFLIKAR.find((f) => f.key === aktivUnderflik) ?? UNDERFLIKAR[0];
  const sok = sokord.trim().toLowerCase();

  // Filtrering i tre steg: först fliken, sedan sökordet, sist sorteringen.
  const synliga = useMemo(() => {
    const iFliken = bokningar.filter(flik.urval);
    const traffar = sok ? iFliken.filter((b) => sokText(b).includes(sok)) : iFliken;
    return [...traffar].sort(jamfor(sortering));
  }, [bokningar, flik, sok, sortering]);

  if (laddar) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-6 h-6 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (bokningar.length === 0 && !fel) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-sm">Inga bokningar ännu.</p>
      </div>
    );
  }

  return (
    <div>
      {fel && <div className="bg-red-50 text-red-500 rounded-2xl p-4 text-sm mb-4">{fel}</div>}

      {/* ── UNDERFLIKAR ──
          Samma utseende som dashboardens huvudflikar i app/dashboard/page.tsx —
          ändrar du stilen där, ändra den här också.
          .meny-etikett (globals.css) reserverar bredden för fetstilen så att
          flikarna inte hoppar i sidled när markeringen flyttas. */}
      <div
        role="tablist"
        aria-label="Filtrera bokningar"
        className="flex gap-1 sm:gap-2 border-b border-gray-200 mb-5 overflow-x-auto max-w-full"
      >
        {UNDERFLIKAR.map((f) => {
          const aktiv = f.key === flik.key;
          const antal = antalPerFlik[f.key] ?? 0;
          // "Kräver åtgärd" får grön siffra när det finns något att göra.
          const framhavd = f.key === "atgard" && antal > 0;
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={aktiv}
              onClick={() => setAktivUnderflik(f.key)}
              className={`text-sm px-3 md:px-4 py-3 border-b-[3px] -mb-px transition-colors whitespace-nowrap ${
                aktiv
                  ? "border-[#2D7A4F] text-[#1a1a1a] font-semibold"
                  : "border-transparent text-gray-400 font-medium hover:text-gray-600 hover:border-gray-200"
              }`}
            >
              <span className="meny-etikett inline-block" data-label={`${f.label} (${antal})`}>
                {f.label}{" "}
                <span className={framhavd ? "text-[#2D7A4F] font-semibold" : ""}>({antal})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SÖK + SORTERING ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input
            type="search"
            value={sokord}
            onChange={(e) => setSokord(e.target.value)}
            placeholder="Sök på företag, kontaktperson, e-post eller rum..."
            aria-label="Sök bland bokningar"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors bg-white"
          />
        </div>
        <select
          value={sortering}
          onChange={(e) => setSortering(e.target.value)}
          aria-label="Sortera bokningar"
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] bg-white sm:w-48"
        >
          {SORTERINGAR.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── RESULTAT ── */}
      {synliga.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          {sok ? (
            <>
              <p className="text-gray-400 text-sm">
                Inga träffar för &rdquo;{sokord.trim()}&rdquo;
              </p>
              <button
                onClick={() => setSokord("")}
                className="mt-4 text-sm bg-white border border-gray-200 text-[#2D7A4F] px-5 py-2 rounded-full hover:border-[#2D7A4F] transition-colors font-medium"
              >
                Rensa sökning
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Inga bokningar i den här fliken.</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            Visar {synliga.length} {synliga.length === 1 ? "bokning" : "bokningar"}
          </p>
          <div className="flex flex-col gap-3">
            {synliga.map((b) => (
              <BokningsKort
                key={b.id}
                b={b}
                oppen={oppnaKort.has(b.id)}
                arbetar={uppdaterarId === b.id}
                slutdatum={slutdatumInput[b.id] ?? ""}
                onVaxlaOppen={() => vaxlaKort(b.id)}
                onSlutdatumChange={(v) =>
                  setSlutdatumInput((prev) => ({ ...prev, [b.id]: v }))
                }
                onUppdatera={(data) => uppdatera(b.id, data)}
                onUppladdat={(partial) =>
                  setBokningar((prev) =>
                    prev.map((x) => (x.id === b.id ? { ...x, ...partial } : x))
                  )
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
