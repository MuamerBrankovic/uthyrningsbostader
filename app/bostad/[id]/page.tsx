"use client";
import { useState, useEffect, use } from "react";
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

type AuthUser = {
  id: string;
  email?: string;
  user_metadata: { namn?: string };
};

export default function BostadSida({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [bostad, setBostad] = useState<Bostad | null>(null);
  const [laddar, setLaddar] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLaddar, setAuthLaddar] = useState(true);
  const [inflyttning, setInflyttning] = useState("");
  const [utflyttning, setUtflyttning] = useState("");
  const [namn, setNamn] = useState("");
  const [email, setEmail] = useState("");
  const [bokad, setBokad] = useState(false);
  const [bokarLaddar, setBokarLaddar] = useState(false);
  const [bokFel, setBokFel] = useState("");

  useEffect(() => {
    async function hamtaBostad() {
      const { data, error } = await supabase
        .from("bostader")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        console.error("Fel:", error);
      } else {
        setBostad(data);
      }
      setLaddar(false);
    }
    hamtaBostad();
  }, [resolvedParams.id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthUser(user as AuthUser);
        setNamn(user.user_metadata?.namn ?? "");
        setEmail(user.email ?? "");
      }
      setAuthLaddar(false);
    });
  }, []);

  async function hanteraBokn() {
    if (!bostad || !inflyttning || !utflyttning || !namn || !email || !authUser) return;
    setBokarLaddar(true);
    setBokFel("");

    const { error } = await supabase.from("bokningar").insert({
      bostad_id: bostad.id,
      namn,
      email,
      inflyttning,
      utflyttning,
      user_id: authUser.id,
    });

    if (error) {
      setBokFel("Något gick fel. Försök igen.");
    } else {
      setBokad(true);
    }
    setBokarLaddar(false);
  }

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
          <a href="/bostader" className="text-[#2D7A4F] text-sm mt-4 block hover:underline">← Tillbaka till alla bostäder</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <a href="/bostader" className="text-sm text-[#2D7A4F] hover:underline mb-8 block">← Tillbaka till alla bostäder</a>

        <div className="grid md:grid-cols-3 gap-8">

          {/* VÄNSTER */}
          <div className="md:col-span-2">
            <div className="h-72 bg-[#e8f5ee] rounded-2xl flex items-center justify-center text-7xl mb-6 relative">
              🏠
              <span className="absolute top-4 left-4 text-xs font-semibold bg-white text-[#2D7A4F] px-3 py-1 rounded-full border border-[#c8e8d8]">
                {bostad.tag}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">{bostad.city}</h1>
            <p className="text-gray-400 mb-6">{bostad.type} · {bostad.size} m²</p>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h2 className="font-semibold text-[#1a1a1a] mb-3">Om bostaden</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{bostad.beskrivning}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-[#1a1a1a] mb-4">Faciliteter</h2>
              <div className="flex flex-wrap gap-2">
                {bostad.facilities?.map((f) => (
                  <span key={f} className="text-xs font-medium bg-[#e8f5ee] text-[#2D7A4F] px-3 py-1.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* HÖGER — Bokningsbox */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <p className="text-2xl font-bold text-[#2D7A4F]">{bostad.price.toLocaleString()} kr</p>
              <p className="text-xs text-gray-400 mb-6">per månad</p>

              {authLaddar ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !authUser ? (
                <div className="bg-[#F8F7F4] rounded-xl p-5 text-center">
                  <p className="text-sm font-medium text-[#1a1a1a] mb-1">Logga in för att boka</p>
                  <p className="text-xs text-gray-400 mb-4">Du behöver ett konto för att skicka en bokningsförfrågan.</p>
                  <a
                    href="/logga-in"
                    className="block bg-[#2D7A4F] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-[#225f3d] transition-colors"
                  >
                    Logga in
                  </a>
                  <a href="/registrera" className="block text-xs text-[#2D7A4F] mt-3 hover:underline">
                    Inget konto? Registrera dig
                  </a>
                </div>
              ) : bokad ? (
                <div className="bg-[#e8f5ee] rounded-xl p-4 text-center">
                  <p className="text-[#2D7A4F] font-semibold text-sm">✓ Bokningsförfrågan skickad!</p>
                  <p className="text-xs text-gray-400 mt-1">Vi återkommer inom 3 timmar.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Ditt namn</label>
                    <input
                      type="text"
                      placeholder="Anna Svensson"
                      value={namn}
                      onChange={(e) => setNamn(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Din e-post</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 bg-gray-50 outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Inflyttningsdatum</label>
                    <input
                      type="date"
                      value={inflyttning}
                      onChange={(e) => setInflyttning(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Utflyttningsdatum</label>
                    <input
                      type="date"
                      value={utflyttning}
                      onChange={(e) => setUtflyttning(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                    />
                  </div>

                  {bokFel && (
                    <div className="bg-red-50 text-red-500 text-xs px-4 py-3 rounded-xl mb-4">
                      {bokFel}
                    </div>
                  )}

                  <button
                    onClick={hanteraBokn}
                    disabled={!inflyttning || !utflyttning || !namn || bokarLaddar}
                    className="w-full bg-[#2D7A4F] text-white text-sm py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    {bokarLaddar ? "Skickar..." : "Skicka bokningsförfrågan"}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-3">Ingen betalning krävs ännu</p>
                </>
              )}

              <div className="border-t border-gray-100 mt-6 pt-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e8f5ee] flex items-center justify-center text-sm">👤</div>
                <div>
                  <p className="text-xs font-semibold text-[#1a1a1a]">Svarar inom 3 timmar</p>
                  <p className="text-xs text-gray-400">Verifierad uthyrare</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
