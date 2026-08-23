"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { BedDouble } from "lucide-react";
import BildPlatshallare from "@/app/components/BildPlatshallare";
import { EPOST } from "@/lib/kontakt";

// Slutvärdet på hyresreglaget. Används på fyra ställen (startvärde, URL-synk,
// reglagets max och nollställningen) — de måste vara samma tal, annars går
// filtret inte att nollställa helt.
const MAX_HYRA = 30000;

const BOSTADSTYPER: { label: string; value: string }[] = [
  { label: "Alla typer", value: "" },
  { label: "Privat rum", value: "privat_rum" },
  { label: "Rum med eget bad", value: "rum_eget_bad" },
  { label: "Hel lägenhet", value: "hel_lagenhet" },
];

type Rum = {
  id: string;
  manadshyra: number;
  bilder: string[];
  bokningar: { slutdatum: string | null }[];
};

// Ledigt = ingen aktiv bekräftad bokning (API:t returnerar bara bekräftade).
function arLedigt(rum: Rum): boolean {
  return !rum.bokningar.some(
    (b) => !b.slutdatum || new Date(b.slutdatum) > new Date()
  );
}

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

// ─── Tomt-lägen ──────────────────────────────────────────────────────────────
// Två olika situationer som inte får se likadana ut för besökaren:
// vi har inget publicerat ännu, kontra besökarens filter gav noll träffar.

function IngaBostaderPublicerade() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center">
      <div className="w-14 h-14 bg-[#e8f5ee] rounded-full flex items-center justify-center mx-auto mb-5">
        <BedDouble className="w-6 h-6 text-[#2D7A4F]" />
      </div>
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
        Bostäderna publiceras inom kort
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto mb-7">
        Vi lägger just nu upp våra första möblerade bostäder i Linköping.
        Behöver ni boende till konsulter innan dess hjälper vi er ändå — berätta
        vad ni söker, så återkommer vi med tillgängliga alternativ.
      </p>
      <Link
        href="/offert"
        className="inline-block bg-[#2D7A4F] text-white text-sm px-8 py-3 rounded-full hover:bg-[#225f3d] transition-colors font-medium"
      >
        Skicka offertförfrågan
      </Link>
      <p className="text-xs text-gray-400 mt-5">
        Eller mejla oss direkt på{" "}
        <a href={`mailto:${EPOST}`} className="text-[#2D7A4F] hover:underline">
          {EPOST}
        </a>
      </p>
    </div>
  );
}

function IngaTraffar({ onNollstall }: { onNollstall: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center">
      <p className="text-gray-500 text-sm mb-6">Inga bostäder matchade dina filter.</p>
      <button
        onClick={onNollstall}
        className="text-sm bg-white border border-gray-200 text-[#2D7A4F] px-6 py-2.5 rounded-full hover:border-[#2D7A4F] transition-colors font-medium"
      >
        Nollställ filter
      </button>
    </div>
  );
}

function BostaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialRender = useRef(true);

  const [bostader, setBostader] = useState<Bostad[]>([]);
  const [bostadstyp, setBostadstyp] = useState(searchParams.get("typ") ?? "");
  const [maxPris, setMaxPris] = useState(Number(searchParams.get("prisMax")) || MAX_HYRA);
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
    if (bostadstyp) params.set("typ", bostadstyp);
    if (maxPris !== MAX_HYRA) params.set("prisMax", String(maxPris));
    router.replace(`/bostader?${params.toString()}`);
  }, [bostadstyp, maxPris]);

  const filtrerade = bostader.filter((b) => {
    const matchTyp = !bostadstyp || b.bostadstyp === bostadstyp;
    const priser = b.rum.map((r) => r.manadshyra);
    const minPris = priser.length > 0 ? Math.min(...priser) : 0;
    const matchPris = priser.length === 0 || minPris <= maxPris;
    return matchTyp && matchPris;
  });

  // Skilj tomt-lägena åt. Att visa "matchade dina filter" när databasen är tom
  // lägger skulden på besökaren för något vi inte publicerat ännu.
  const ingaBostaderAlls = !laddar && bostader.length === 0;
  const ingaTraffar = !laddar && bostader.length > 0 && filtrerade.length === 0;

  function nollstallFilter() {
    setBostadstyp("");
    setMaxPris(MAX_HYRA);
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* RUBRIK */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Lediga bostäder</h1>
          <p className="text-gray-400 text-sm">
            Möblerade bostäder för konsulter i Linköping
          </p>
        </div>

        {/* FILTER — döljs helt när ingenting är publicerat. Ett filterreglage
            ovanför ett tomt resultat antyder att besökaren filtrerat bort allt,
            vilket inte är vad som hänt. */}
        {!ingaBostaderAlls && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10 space-y-5">

            <div className="flex flex-col md:flex-row gap-5">
              {/* Bostadstyp */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Bostadstyp
                </label>
                <div className="flex gap-2 flex-wrap">
                  {BOSTADSTYPER.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setBostadstyp(t.value)}
                      className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                        bostadstyp === t.value
                          ? "bg-[#2D7A4F] text-white border-[#2D7A4F]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#2D7A4F]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max pris */}
              <div className="md:w-64">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Max hyra: <span className="text-[#2D7A4F]">{maxPris.toLocaleString()} kr/mån</span>
                </label>
                <input
                  type="range"
                  min="3000"
                  max={MAX_HYRA}
                  step="500"
                  value={maxPris}
                  onChange={(e) => setMaxPris(Number(e.target.value))}
                  className="w-full accent-[#2D7A4F]"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400">{filtrerade.length} bostäder hittade</p>
          </div>
        )}

        {/* RESULTAT */}
        {laddar ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Hämtar bostäder...</p>
          </div>
        ) : ingaBostaderAlls ? (
          <IngaBostaderPublicerade />
        ) : ingaTraffar ? (
          <IngaTraffar onNollstall={nollstallFilter} />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filtrerade.map((b) => {
              const priser = b.rum.map((r) => r.manadshyra);
              const minPris = priser.length > 0 ? Math.min(...priser) : null;
              const ledigaRum = b.rum.filter(arLedigt).length;

              return (
                <Link
                  href={`/bostad/${b.id}`}
                  key={b.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer block"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-[#e8f5ee]">
                    {(() => {
                      const forstaRumBild = b.rum.find((r) => r.bilder.length > 0)?.bilder[0];
                      const bildUrl = b.bilder[0] ?? forstaRumBild ?? null;
                      return bildUrl ? (
                        <Image
                          src={bildUrl}
                          alt={b.namn}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
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
            })}
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
