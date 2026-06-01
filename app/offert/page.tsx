"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const INPUT_CLS =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors bg-white";
const LABEL_CLS =
  "text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2";

type Status = "idle" | "sending" | "done" | "error";

export default function OffertSida() {
  const [form, setForm] = useState({
    foretag: "",
    orgnr: "",
    kontaktperson: "",
    email: "",
    telefon: "",
    stad: "Linköping",
    antal_personer: "",
    inflyttning: "",
    bostadstyp: "",
    meddelande: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [fel, setFel] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setFel("");
    try {
      const res = await fetch("/api/offert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          antal_personer: form.antal_personer || undefined,
          inflyttning: form.inflyttning || undefined,
          bostadstyp: form.bostadstyp || undefined,
          orgnr: form.orgnr || undefined,
          meddelande: form.meddelande || undefined,
        }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setFel(data.error ?? "Något gick fel. Försök igen.");
        setStatus("error");
      }
    } catch {
      setFel("Kunde inte skicka. Kontrollera anslutningen.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="min-h-screen bg-[#F8F7F4]">
        <section className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-10 md:p-14">
            <div className="w-16 h-16 rounded-full bg-[#e8f5ee] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#2D7A4F]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-3">
              Tack, vi har tagit emot din förfrågan!
            </h1>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-8">
              Vi återkommer normalt inom 3 timmar på vardagar med ett skräddarsytt förslag.
              En bekräftelse är skickad till{" "}
              <span className="text-[#1a1a1a] font-medium">{form.email}</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-block bg-[#2D7A4F] text-white text-sm font-semibold px-8 py-3 rounded-full hover:bg-[#225f3d] transition-colors"
              >
                Till startsidan
              </Link>
              <Link
                href="/bostader"
                className="inline-block bg-white border border-gray-200 text-[#1a1a1a] text-sm font-medium px-8 py-3 rounded-full hover:border-[#2D7A4F] transition-colors"
              >
                Se bostäder
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const sending = status === "sending";

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      {/* HERO */}
      <section className="bg-white border-b border-gray-100 py-14 md:py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">
            Få offert
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-3 mb-4">
            Begär offert
          </h1>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            Berätta kort om ert behov så återkommer vi med ett anpassat förslag.
            Vi svarar normalt inom <span className="text-[#2D7A4F] font-medium">3 timmar</span> på vardagar.
            Inga förpliktelser.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10"
          >
            <h2 className="font-semibold text-[#1a1a1a] mb-1">Företagsuppgifter</h2>
            <p className="text-xs text-gray-400 mb-6">
              Vi behandlar all information konfidentiellt.
            </p>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div className="md:col-span-2">
                <label className={LABEL_CLS}>
                  Företagsnamn <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.foretag}
                  onChange={(e) => update("foretag", e.target.value)}
                  placeholder="t.ex. Tech Consulting AB"
                  className={INPUT_CLS}
                  disabled={sending}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Organisationsnummer</label>
                <input
                  type="text"
                  value={form.orgnr}
                  onChange={(e) => update("orgnr", e.target.value)}
                  placeholder="556000-0000"
                  className={INPUT_CLS}
                  disabled={sending}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  Kontaktperson <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.kontaktperson}
                  onChange={(e) => update("kontaktperson", e.target.value)}
                  placeholder="För- och efternamn"
                  className={INPUT_CLS}
                  disabled={sending}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  E-post <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="namn@foretag.se"
                  className={INPUT_CLS}
                  disabled={sending}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  Telefon <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.telefon}
                  onChange={(e) => update("telefon", e.target.value)}
                  placeholder="070-000 00 00"
                  className={INPUT_CLS}
                  disabled={sending}
                />
              </div>
            </div>

            <h2 className="font-semibold text-[#1a1a1a] mb-1 mt-8 pt-6 border-t border-gray-100">
              Boendebehov
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Vi anpassar offerten efter era behov.
            </p>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={LABEL_CLS}>Stad</label>
                <select
                  value={form.stad}
                  onChange={(e) => update("stad", e.target.value)}
                  className={INPUT_CLS}
                  disabled={sending}
                >
                  <option value="Linköping">Linköping</option>
                  <option value="Norrköping">Norrköping</option>
                  <option value="Annan">Annan</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Antal personer</label>
                <input
                  type="number"
                  min="1"
                  value={form.antal_personer}
                  onChange={(e) => update("antal_personer", e.target.value)}
                  placeholder="t.ex. 2"
                  className={INPUT_CLS}
                  disabled={sending}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Önskat inflyttningsdatum</label>
                <input
                  type="date"
                  value={form.inflyttning}
                  onChange={(e) => update("inflyttning", e.target.value)}
                  className={INPUT_CLS}
                  disabled={sending}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Bostadstyp</label>
                <select
                  value={form.bostadstyp}
                  onChange={(e) => update("bostadstyp", e.target.value)}
                  className={INPUT_CLS}
                  disabled={sending}
                >
                  <option value="">— Välj —</option>
                  <option value="privat_rum">Privat rum</option>
                  <option value="rum_eget_bad">Rum med eget bad</option>
                  <option value="hel_lagenhet">Hel lägenhet</option>
                  <option value="vet_ej">Vet ej</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLS}>Meddelande</label>
                <textarea
                  value={form.meddelande}
                  onChange={(e) => update("meddelande", e.target.value)}
                  rows={4}
                  placeholder="Berätta mer om ert behov, uppdragslängd, särskilda önskemål..."
                  className={`${INPUT_CLS} resize-none`}
                  disabled={sending}
                />
              </div>
            </div>

            {fel && (
              <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">
                {fel}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center sm:text-left">
                Genom att skicka godkänner du att vi kontaktar er.<br className="hidden sm:block" />
                Inga förpliktelser.
              </p>
              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto bg-[#2D7A4F] text-white text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-[#225f3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Skickar..." : "Skicka offertförfrågan"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
