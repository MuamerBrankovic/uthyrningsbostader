"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

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
  }, [valdaStader, bostadstyp, maxPris]);

  function toggleStad(stad: string) {
    setValdaStader((prev) =>
      prev.includes(stad)
        ? prev.filter((s) => s !== stad)
        : [...prev, stad]
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

        {/* RUBRIK */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Lediga bostäder</h1>
          <p className="text-gray-400 text-sm">
            Möblerade bostäder för konsulter i Linköping och Norrköping
          </p>
        </div>

        {/* FILTER */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10 space-y-5">

          {/* Stad */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Stad
            </label>
            <div className="flex gap-2 flex-wrap">
              {STADER.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStad(s)}
                  className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                    valdaStader.includes(s)
                      ? "bg-[#2D7A4F] text-white border-[#2D7A4F]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#2D7A4F]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

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
                max="30000"
                step="500"
                value={maxPris}
                onChange={(e) => setMaxPris(Number(e.target.value))}
                className="w-full accent-[#2D7A4F]"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">{filtrerade.length} bostäder hittade</p>
        </div>

        {/* LADDNING */}
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
                  <Link
                    href={`/bostad/${b.id}`}
                    key={b.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <div className="h-48 bg-[#e8f5ee] flex items-center justify-center text-4xl relative overflow-hidden">
                      {(() => {
                        const forstaRumBild = b.rum.find((r) => r.bilder.length > 0)?.bilder[0];
                        const bildUrl = b.bilder[0] ?? forstaRumBild ?? null;
                        return bildUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={bildUrl} alt={b.namn} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#2D7A4F] opacity-30 text-6xl select-none">🏠</span>
                        );
                      })()}
                      {ledigaRum > 0 && (
                        <span className="absolute top-3 left-3 text-xs font-semibold bg-white text-[#2D7A4F] px-3 py-1 rounded-full border border-[#c8e8d8]">
                          {ledigaRum} ledigt rum
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-[#1a1a1a] leading-snug">{b.namn}</h3>
                        <BostadsTypBadge typ={b.bostadstyp} />
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">
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
