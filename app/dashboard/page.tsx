"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Bokning = {
  id: string;
  bostad_id: string;
  namn: string;
  email: string;
  inflyttning: string;
  utflyttning: string;
  created_at: string;
  bostader: {
    city: string;
    type: string;
    price: number;
  };
};

type User = {
  id: string;
  email: string;
  user_metadata: { namn: string; roll: string };
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [bokningar, setBokningar] = useState<Bokning[]>([]);
  const [laddar, setLaddar] = useState(true);
  const [aktivFlik, setAktivFlik] = useState<"bokningar" | "laggUpp">("bokningar");

  // Lägg upp bostad
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [beskrivning, setBeskrivning] = useState("");
  const [facilities, setFacilities] = useState("");
  const [sparad, setSparad] = useState(false);
  const [spararLaddar, setSpararLaddar] = useState(false);

  useEffect(() => {
    async function hamtaData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/logga-in";
        return;
      }

      setUser(user as unknown as User);

      const { data } = await supabase
        .from("bokningar")
        .select("*, bostader(city, type, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBokningar(data || []);
      setLaddar(false);
    }
    hamtaData();
  }, []);

  async function handleLaggUpp() {
    if (!city || !type || !price || !size) return;
    setSpararLaddar(true);

    const facilitiesArray = facilities
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const { error } = await supabase.from("bostader").insert({
      city,
      type,
      price: Number(price),
      size: Number(size),
      beskrivning,
      facilities: facilitiesArray,
      tag: "Ny",
      owner_id: user?.id,
    });

    if (!error) {
      setSparad(true);
      setCity("");
      setType("");
      setPrice("");
      setSize("");
      setBeskrivning("");
      setFacilities("");
      setTimeout(() => setSparad(false), 3000);
    }
    setSpararLaddar(false);
  }

  if (laddar) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Laddar dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4]">

      <div className="max-w-5xl mx-auto px-8 py-12">

        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Min dashboard</h1>
        <p className="text-gray-400 mb-10">Hantera dina bokningar och bostäder</p>

        {/* FLIKAR */}
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-100 w-fit mb-8">
          <button
            onClick={() => setAktivFlik("bokningar")}
            className={`text-sm px-6 py-2.5 rounded-lg font-medium transition-colors ${
              aktivFlik === "bokningar"
                ? "bg-[#2D7A4F] text-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Mina bokningar
          </button>
          <button
            onClick={() => setAktivFlik("laggUpp")}
            className={`text-sm px-6 py-2.5 rounded-lg font-medium transition-colors ${
              aktivFlik === "laggUpp"
                ? "bg-[#2D7A4F] text-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Lägg upp bostad
          </button>
        </div>

        {/* BOKNINGAR */}
        {aktivFlik === "bokningar" && (
          <div>
            {bokningar.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-4xl mb-4">🏠</p>
                <p className="text-gray-400 text-sm">Du har inga bokningar ännu.</p>
                <a href="/bostader" className="inline-block mt-4 bg-[#2D7A4F] text-white text-sm px-6 py-2.5 rounded-full hover:bg-[#225f3d] transition-colors">
                  Hitta en bostad
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {bokningar.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 bg-[#e8f5ee] rounded-xl flex items-center justify-center text-xl">🏠</div>
                      <div>
                        <h3 className="font-semibold text-[#1a1a1a]">{b.bostader?.city}</h3>
                        <p className="text-sm text-gray-400">{b.bostader?.type}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {b.inflyttning} → {b.utflyttning}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#2D7A4F] font-bold">{b.bostader?.price.toLocaleString()} kr/mån</p>
                      <span className="inline-block text-xs bg-[#e8f5ee] text-[#2D7A4F] px-3 py-1 rounded-full mt-2">
                        Förfrågan skickad
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LÄGG UPP BOSTAD */}
        {aktivFlik === "laggUpp" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="font-semibold text-[#1a1a1a] mb-6">Lägg upp en ny bostad</h2>

            {sparad && (
              <div className="bg-[#e8f5ee] text-[#2D7A4F] text-sm px-4 py-3 rounded-xl mb-6">
                ✓ Bostaden har lagts upp och syns nu i listan!
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Stad</label>
                <input
                  type="text"
                  placeholder="t.ex. Stockholm"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Typ</label>
                <input
                  type="text"
                  placeholder="t.ex. 2 rum & kök"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Pris (kr/mån)</label>
                <input
                  type="number"
                  placeholder="t.ex. 15000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Storlek (m²)</label>
                <input
                  type="number"
                  placeholder="t.ex. 55"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Beskrivning</label>
              <textarea
                placeholder="Beskriv bostaden..."
                value={beskrivning}
                onChange={(e) => setBeskrivning(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors resize-none"
              />
            </div>

            <div className="mb-8">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Faciliteter <span className="normal-case font-normal">(separera med komma)</span>
              </label>
              <input
                type="text"
                placeholder="t.ex. WiFi, Parkering, Balkong"
                value={facilities}
                onChange={(e) => setFacilities(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
              />
            </div>

            <button
              onClick={handleLaggUpp}
              disabled={!city || !type || !price || !size || spararLaddar}
              className="bg-[#2D7A4F] text-white text-sm px-8 py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {spararLaddar ? "Sparar..." : "Lägg upp bostad"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
