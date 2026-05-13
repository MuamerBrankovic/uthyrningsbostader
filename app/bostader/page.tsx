"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

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
  rum: Rum[];
};

function BostaderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialRender = useRef(true);

  const [bostader, setBostader] = useState<Bostad[]>([]);
  const [sokord, setSokord] = useState(searchParams.get("city") ?? "");
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
    if (sokord) params.set("city", sokord);
    if (maxPris !== 30000) params.set("prisMax", String(maxPris));
    router.replace(`/bostader?${params.toString()}`);
  }, [sokord, maxPris]);

  const filtrerade = bostader.filter((b) => {
    const matchSok =
      b.namn.toLowerCase().includes(sokord.toLowerCase()) ||
      (b.stadsdel ?? "").toLowerCase().includes(sokord.toLowerCase()) ||
      (b.adress ?? "").toLowerCase().includes(sokord.toLowerCase());
    const priser = b.rum.map((r) => r.manadshyra);
    const minPris = priser.length > 0 ? Math.min(...priser) : 0;
    const matchPris = priser.length === 0 || minPris <= maxPris;
    return matchSok && matchPris;
  });

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Lediga bostäder</h1>
        <p className="text-gray-400 mb-10">Hitta din perfekta bostad i hela Sverige</p>

        {/* FILTER */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Sök stad eller område
            </label>
            <input
              type="text"
              placeholder="t.ex. Stockholm..."
              value={sokord}
              onChange={(e) => setSokord(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
            />
          </div>
          <div className="flex-1">
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
          <div>
            <p className="text-sm text-gray-400">{filtrerade.length} bostäder hittade</p>
          </div>
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
                Inga bostäder matchade din sökning.
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
                          <span>🏠</span>
                        );
                      })()}
                      {ledigaRum > 0 && (
                        <span className="absolute top-3 left-3 text-xs font-semibold bg-white text-[#2D7A4F] px-3 py-1 rounded-full border border-[#c8e8d8]">
                          {ledigaRum} ledigt rum
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-[#1a1a1a]">{b.namn}</h3>
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
