"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [stad, setStad] = useState("");
  const router = useRouter();

  function handleSok() {
    const params = new URLSearchParams();
    if (stad.trim()) params.set("city", stad.trim());
    router.push(`/bostader?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] font-sans">

      {/* HERO */}
      <section className="px-8 py-24 max-w-5xl mx-auto text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#2D7A4F] bg-[#e8f5ee] px-4 py-1.5 rounded-full mb-6">
          Möblerade bostäder i hela Sverige
        </span>
        <h1 className="text-5xl font-bold text-[#1a1a1a] leading-tight mb-6">
          Hitta din nästa <br />
          <span className="text-[#2D7A4F]">företagsbostad</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10">
          Vi kopplar ihop företag och privatpersoner med trygga, möblerade bostäder — snabbt och enkelt.
        </p>

        {/* SÖKFÄLT */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSok(); }}
          className="flex flex-col md:flex-row gap-3 justify-center items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto"
        >
          <input
            type="text"
            placeholder="Stad eller område..."
            value={stad}
            onChange={(e) => setStad(e.target.value)}
            className="flex-1 px-4 py-3 text-sm text-gray-700 outline-none bg-transparent w-full"
          />
          <div className="w-px h-8 bg-gray-200 hidden md:block" />
          <input
            type="date"
            className="flex-1 px-4 py-3 text-sm text-gray-400 outline-none bg-transparent w-full"
          />
          <button
            type="submit"
            className="bg-[#2D7A4F] text-white text-sm px-8 py-3 rounded-xl hover:bg-[#225f3d] transition-colors w-full md:w-auto"
          >
            Sök
          </button>
        </form>
      </section>

      {/* STATISTIK */}
      <section className="bg-white border-y border-gray-100 py-12 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "500+", label: "Aktiva bostäder" },
            { num: "3h", label: "Genomsnittlig svarstid" },
            { num: "98%", label: "Nöjda hyresgäster" },
            { num: "1.9%", label: "Skadeanmälningar" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-[#2D7A4F]">{s.num}</p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SÅ FUNGERAR DET */}
      <section className="py-20 px-8 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-3">Så enkelt fungerar det</h2>
        <p className="text-gray-400 mb-14">Tre steg till din nya bostad</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Sök bostad", desc: "Filtrera på stad, datum och storlek. Vi har bostäder i hela Sverige." },
            { step: "02", title: "Boka direkt", desc: "Välj datum och slutför bokningen digitalt — inga krångliga papper." },
            { step: "03", title: "Flytta in", desc: "Allt är möblerat och klart. Du behöver bara ta med dig ditt bagage." },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl p-8 border border-gray-100 text-left hover:shadow-sm transition-shadow">
              <span className="text-4xl font-bold text-[#2D7A4F] opacity-40">{item.step}</span>
              <h3 className="text-lg font-semibold text-[#1a1a1a] mt-3 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* UTVALDA BOSTÄDER */}
      <section className="py-20 px-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-[#1a1a1a]">Utvalda bostäder</h2>
            <p className="text-gray-400 mt-1">Populära val just nu</p>
          </div>
          <Link href="/bostader" className="text-sm text-[#2D7A4F] font-medium hover:underline">Visa alla →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { city: "Stockholm", type: "2 rum & kök", price: "18 500 kr/mån", tag: "Populär" },
            { city: "Göteborg", type: "1 rum & kök", price: "12 000 kr/mån", tag: "Ny" },
            { city: "Malmö", type: "3 rum & kök", price: "22 000 kr/mån", tag: "Tillgänglig" },
          ].map((b) => (
            <div key={b.city} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-48 bg-[#e8f5ee] flex items-center justify-center text-[#2D7A4F] text-4xl relative">
                🏠
                <span className="absolute top-3 left-3 text-xs font-semibold bg-white text-[#2D7A4F] px-3 py-1 rounded-full border border-[#c8e8d8]">
                  {b.tag}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[#1a1a1a]">{b.city}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{b.type}</p>
                <p className="text-[#2D7A4F] font-bold mt-3">{b.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a1a1a] text-gray-400 py-12 px-8 mt-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <span className="text-white font-bold text-lg">Uthyrnings<span className="text-[#2D7A4F]">Bostäder</span></span>
            <p className="text-sm mt-2 max-w-xs">Trygga möblerade bostäder för företag och privatpersoner i hela Sverige.</p>
          </div>
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-white font-medium mb-1">Tjänster</span>
              <Link href="/bostader" className="hover:text-white transition-colors">Hitta bostad</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Hyra ut</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-white font-medium mb-1">Företaget</span>
              <a href="#" className="hover:text-white transition-colors">Om oss</a>
              <a href="#" className="hover:text-white transition-colors">Kontakt</a>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-gray-700 mt-10 pt-6 text-xs text-gray-600">
          © 2026 UthyrningsBostäder. Alla rättigheter förbehållna.
        </div>
      </footer>

    </main>
  );
}
