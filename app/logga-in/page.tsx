"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoggaIn() {
  const [email, setEmail] = useState("");
  const [losenord, setLosenord] = useState("");
  const [laddar, setLaddar] = useState(false);
  const [inloggad, setInloggad] = useState(false);
  const [fel, setFel] = useState("");
  const router = useRouter();

  async function handleLoggaIn() {
    if (!email || !losenord) return;
    setLaddar(true);
    setFel("");

    const res = await fetch("/api/auth/logga-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, losenord }),
    });

    if (res.ok) {
      setInloggad(true);
      router.refresh();
    } else {
      const data = await res.json();
      setFel(data.error ?? "Fel e-post eller lösenord. Försök igen.");
    }
    setLaddar(false);
  }

  if (inloggad) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#e8f5ee] rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Välkommen tillbaka!</h2>
          <p className="text-gray-400 text-sm mb-6">Du är nu inloggad.</p>
          <Link href="/" className="bg-[#2D7A4F] text-white text-sm px-8 py-3 rounded-full hover:bg-[#225f3d] transition-colors">
            Gå till startsidan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
            Uthyrnings<span className="text-[#2D7A4F]">Bostäder</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">Logga in på ditt konto</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">

          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              E-postadress
            </label>
            <input
              type="email"
              placeholder="din@email.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
            />
          </div>

          <div className="mb-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Lösenord
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={losenord}
              onChange={(e) => setLosenord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoggaIn()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
            />
          </div>

          <div className="text-right mb-6">
            <a href="#" className="text-xs text-[#2D7A4F] hover:underline">Glömt lösenord?</a>
          </div>

          {fel && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-4">
              {fel}
            </div>
          )}

          <button
            onClick={handleLoggaIn}
            disabled={!email || !losenord || laddar}
            className="w-full bg-[#2D7A4F] text-white text-sm py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            {laddar ? "Loggar in..." : "Logga in"}
          </button>

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Inget konto?{" "}
          <Link href="/registrera" className="text-[#2D7A4F] font-medium hover:underline">
            Registrera dig här
          </Link>
        </p>

      </div>
    </main>
  );
}
