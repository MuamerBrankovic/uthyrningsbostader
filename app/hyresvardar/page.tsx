"use client";
import { useState } from "react";
import type { FormEvent } from "react";

export default function Hyresvardar() {
  const [form, setForm] = useState({
    namn: "",
    telefon: "",
    email: "",
    stad: "",
    adress: "",
    meddelande: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/hyresvardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4]">

      {/* HERO */}
      <section className="bg-white border-b border-gray-100 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">För hyresvärdar</span>
          <h1 className="text-4xl font-bold text-[#1a1a1a] mt-3 mb-5">
            Trygga hyresgäster.<br className="hidden md:block" /> Stabil inkomst.
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto">
            Vi matchar din bostad med seriösa företagshyresgäster — konsulter vars arbetsgivare
            betalar hyran. Minimalt krångel, maximalt förtroende.
          </p>
        </div>
      </section>

      {/* FÖRDELAR */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Varför hyra ut via oss?</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3">Vad vi erbjuder dig</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              titel: "Seriösa hyresgäster",
              text: "Våra hyresgäster är konsulter och tjänsteresenärer med arbetsgivare som betalar hyran. Det ger dig trygghet och minimerar risken för sena betalningar.",
            },
            {
              titel: "Vi sköter kommunikationen",
              text: "Du slipper ha kontakt med tiotals privatpersoner. Vi är mellanhanden — du kommunicerar med oss, vi sköter resten.",
            },
            {
              titel: "Flexibla perioder",
              text: "Välj vilka perioder du vill hyra ut. Inga tvingande exklusivavtal. Du bestämmer tillgängligheten, vi fyller den.",
            },
            {
              titel: "Besiktning ingår",
              text: "Vi besiktar bostaden innan den listas. Det skyddar dig och ger hyresgästen rätt förväntningar. Dokumentation finns alltid.",
            },
            {
              titel: "Snabb match",
              text: "Vi har ett aktivt flöde av efterfrågan. En godkänd bostad är sällan ledig länge.",
            },
            {
              titel: "Transparent avräkning",
              text: "Tydlig månadsavräkning. Du vet exakt vad du får och när det betalas ut.",
            },
          ].map((f) => (
            <div key={f.titel} className="bg-white rounded-2xl border border-gray-100 p-7">
              <div className="w-8 h-8 rounded-full bg-[#e8f5ee] mb-4" />
              <h3 className="font-semibold text-[#1a1a1a] mb-2">{f.titel}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESSEN */}
      <section className="bg-white border-y border-gray-100 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Processen</span>
            <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3">Fyra steg till uthyrning</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Anmäl din bostad", desc: "Fyll i formuläret nedan eller ring oss. Vi återkommer inom 24 timmar." },
              { num: "2", title: "Besiktning", desc: "Vi besiktar bostaden och dokumenterar skicket. Det skyddar båda parter." },
              { num: "3", title: "Listning", desc: "Bostaden listas i vår plattform och matchas mot aktuell efterfrågan." },
              { num: "4", title: "Uthyrning", desc: "Vi hanterar avtal, inflyttning och kontakt. Du får hyran i tid varje månad." },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#e8f5ee] text-[#2D7A4F] font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-2 text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KONTAKTFORMULÄR */}
      <section className="py-20 px-6 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Kom igång</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3">Anmäl din bostad</h2>
          <p className="text-gray-500 text-sm mt-2">Vi återkommer inom 24 timmar på vardagar.</p>
        </div>

        {status === "done" ? (
          <div className="bg-[#e8f5ee] border border-[#c8e8d8] rounded-2xl p-10 text-center">
            <p className="text-[#2D7A4F] font-semibold text-lg mb-2">Tack för din anmälan!</p>
            <p className="text-gray-600 text-sm">Vi återkommer inom 24 timmar för att boka ett besök.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Namn <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.namn}
                  onChange={(e) => update("namn", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                  placeholder="Ditt namn"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => update("telefon", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                  placeholder="07X-XXX XX XX"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                E-post <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                placeholder="din@email.se"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Stad
                </label>
                <select
                  value={form.stad}
                  onChange={(e) => update("stad", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors bg-white"
                >
                  <option value="">Välj stad</option>
                  <option value="Linköping">Linköping</option>
                  <option value="Norrköping">Norrköping</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Adress
                </label>
                <input
                  type="text"
                  value={form.adress}
                  onChange={(e) => update("adress", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors"
                  placeholder="Gatuadress"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Meddelande
              </label>
              <textarea
                value={form.meddelande}
                onChange={(e) => update("meddelande", e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors resize-none"
                placeholder="Beskriv bostaden kort — antal rum, möblering, tillgänglig period..."
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm">Något gick fel. Försök igen eller mejla oss direkt.</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-[#2D7A4F] text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-60"
            >
              {status === "sending" ? "Skickar..." : "Skicka anmälan"}
            </button>
          </form>
        )}
      </section>

    </main>
  );
}
