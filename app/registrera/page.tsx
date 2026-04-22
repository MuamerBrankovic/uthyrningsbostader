"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Registrera() {
  const [namn, setNamn] = useState("");
  const [email, setEmail] = useState("");
  const [losenord, setLosenord] = useState("");
  const [roll, setRoll] = useState<"hyresgast" | "uthyrare">("hyresgast");
  const [laddar, setLaddar] = useState(false);
  const [registrerad, setRegistrerad] = useState(false);
  const [fel, setFel] = useState("");

  async function handleRegistrera() {
    if (!namn || !email || !losenord) return;
    setLaddar(true);
    setFel("");

    const { error } = await supabase.auth.signUp({
      email,
      password: losenord,
      options: {
        data: { namn, roll },
      },
    });

    if (error) {
      setFel(error.message);
    } else {
      setRegistrerad(true);
    }
    setLaddar(false);
  }

  if (registrerad) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#e8f5ee] rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Konto skapat!</h2>
          <p className="text-gray-400 text-sm mb-2">Välkommen, {namn}!</p>
          <p className="text-gray-400 text-sm mb-6">Kolla din e-post för att bekräfta ditt konto.</p>
          <a href="/" className="bg-[#2D7A4F] text-white text-sm px-8 py-3 rounded-full hover:bg-[#225f3d] transition-colors">
            Gå till startsidan
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <a href="/" className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
            Uthyrnings<span className="text-[#2D7A4F]">Bostäder</span>
          </a>
          <p className="text-gray-400 text-sm mt-2">Skapa ditt konto</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">

          <div className="flex gap-2 mb-6 bg-[#F8F7F4] p-1 rounded-xl">
            <button
              onClick={() => setRoll("hyresgast")}
              className={`flex-1 text-sm py-2.5 rounded-lg font-medium transition-colors ${
                roll === "hyresgast"
                  ? "bg-white text-[#2D7A4F] shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Jag vill hyra
            </button>
            <button
              onClick={() => setRoll("uthyrare")}
              className={`flex-1 text-sm py-2.5 rounded-lg font-medium transition-colors ${
                roll === "uthyrare"
                  ? "bg-white text-[#2D7A4F] shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Jag vill hyra ut
            </button>
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Fullständigt namn</label>
            <input
              type="text"
              placeholder="Anna Svensson"
              value={namn}
              onChange={(e) => setNamn(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
            />
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">E-postadress</label>
            <input
              type="email"
              placeholder="din@email.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Lösenord</label>
            <input
              type="password"
              placeholder="Minst 6 tecken"
              value={losenord}
              onChange={(e) => setLosenord(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
            />
          </div>

          {fel && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-4">
              {fel}
            </div>
          )}

          <button
            onClick={handleRegistrera}
            disabled={!namn || !email || !losenord || laddar}
            className="w-full bg-[#2D7A4F] text-white text-sm py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            {laddar ? "Skapar konto..." : "Skapa konto"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Genom att registrera dig godkänner du våra{" "}
            <a href="#" className="text-[#2D7A4F] hover:underline">användarvillkor</a>
          </p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Har du redan ett konto?{" "}
          <a href="/logga-in" className="text-[#2D7A4F] font-medium hover:underline">
            Logga in här
          </a>
        </p>

      </div>
    </main>
  );
}