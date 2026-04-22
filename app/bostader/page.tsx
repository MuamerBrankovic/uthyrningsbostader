"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Bostad = {
  id: string;
  city: string;
  type: string;
  price: number;
  size: number;
  tag: string;
  beskrivning: string;
  facilities: string[];
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
    async function hamtaBostader() {
      const { data, error } = await supabase
        .from("bostader")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fel vid hämtning:", error);
      } else {
        setBostader(data || []);
      }
      setLaddar(false);
    }
    hamtaBostader();
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
    const matchCity = b.city.toLowerCase().includes(sokord.toLowerCase());
    const matchPris = b.price <= maxPris;
    return matchCity && matchPris;
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
              Sök stad
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
              Max pris: <span className="text-[#2D7A4F]">{maxPris.toLocaleString()} kr/mån</span>
            </label>
            <input
              type="range"
              min="5000"
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
              <p className="text-gray-400 col-span-3 text-center py-20">Inga bostäder matchade din sökning.</p>
            ) : (
              filtrerade.map((b) => (
                <a href={`/bostad/${b.id}`} key={b.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
                  <div className="h-48 bg-[#e8f5ee] flex items-center justify-center text-4xl relative">
                    🏠
                    <span className="absolute top-3 left-3 text-xs font-semibold bg-white text-[#2D7A4F] px-3 py-1 rounded-full border border-[#c8e8d8]">
                      {b.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-[#1a1a1a]">{b.city}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{b.type} · {b.size} m²</p>
                    <p className="text-[#2D7A4F] font-bold mt-3">{b.price.toLocaleString()} kr/mån</p>
                  </div>
                </a>
              ))
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
