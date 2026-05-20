"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Bildgalleri from "@/app/components/Bildgalleri";
import { formateraDatum, formateraKortDatum } from "@/lib/datum";
import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";

type Bokning = {
  id: string;
  startdatum: string;
  slutdatum: string | null;
  status: string;
};

type Rum = {
  id: string;
  namn: string;
  beskrivning: string | null;
  bilder: string[];
  kvm: number | null;
  manadshyra: number;
  moblering: string[];
  status: string;
  bokningar: Bokning[];
  bostad: {
    id: string;
    namn: string;
    adress: string | null;
    stadsdel: string | null;
    kontaktperson_namn: string | null;
    kontaktperson_bild: string | null;
    kontaktperson_email: string | null;
    kontaktperson_telefon: string | null;
  };
};

function getForstaLedigaDatum(bokningar: Bokning[]): string {
  const active = bokningar.filter((b) => {
    if (b.status === "avbokad") return false;
    if (!b.slutdatum) return true;
    return new Date(b.slutdatum) > new Date();
  });

  if (active.length === 0) return new Date().toISOString().split("T")[0];

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 10);
    return far.toISOString().split("T")[0];
  }

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  latest.setDate(latest.getDate() + 1);
  return latest.toISOString().split("T")[0];
}

function getRumStatusLabel(bokningar: Bokning[]): { label: string; color: string } {
  const active = bokningar.filter((b) => {
    if (b.status === "avbokad") return false;
    if (!b.slutdatum) return true;
    return new Date(b.slutdatum) > new Date();
  });

  if (active.length === 0) return { label: "Ledigt nu", color: "green" };

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) return { label: "Bokat", color: "gray" };

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  const fran = new Date(latest);
  fran.setDate(fran.getDate() + 1);
  return { label: `Ledigt från ${formateraDatum(fran)}`, color: "yellow" };
}

function StatusCirkelStor({ color }: { color: "green" | "yellow" | "gray" }) {
  if (color === "green") {
    return (
      <span className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
        <CheckCircle className="w-5 h-5 text-white" />
      </span>
    );
  }
  if (color === "yellow") {
    return (
      <span className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
        <Clock className="w-5 h-5 text-white" />
      </span>
    );
  }
  return (
    <span className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
      <XCircle className="w-5 h-5 text-white" />
    </span>
  );
}

type Avtalstyp = "medlemskap" | "standard" | "premium";

type BokningForm = {
  kund_foretag: string;
  kund_orgnr: string;
  kund_kontaktperson: string;
  boende_namn: string;
  email: string;
  telefon: string;
  startdatum: string;
  avtalstyp: Avtalstyp;
};

function BokningsModal({
  rum,
  onClose,
  onSuccess,
}: {
  rum: Rum;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const minDatum = getForstaLedigaDatum(rum.bokningar);

  const [form, setForm] = useState<BokningForm>({
    kund_foretag: "",
    kund_orgnr: "",
    kund_kontaktperson: "",
    boende_namn: "",
    email: "",
    telefon: "",
    startdatum: minDatum,
    avtalstyp: "standard",
  });
  const [skickar, setSkickar] = useState(false);
  const [fel, setFel] = useState("");

  function update(field: keyof BokningForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSkickar(true);
    setFel("");

    const res = await fetch("/api/bokningar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rum_id: rum.id }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      setFel(data.error ?? "Något gick fel. Försök igen.");
    }
    setSkickar(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#1a1a1a]">Boka {rum.namn}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{rum.bostad.namn}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1a1a1a] transition-colors p-1"
            aria-label="Stäng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Företag <span className="normal-case font-normal">(valfritt)</span>
            </label>
            <input type="text" placeholder="AB Exempelföretag" value={form.kund_foretag}
              onChange={(e) => update("kund_foretag", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Organisationsnummer <span className="normal-case font-normal">(valfritt)</span>
            </label>
            <input type="text" placeholder="556000-0000" value={form.kund_orgnr}
              onChange={(e) => update("kund_orgnr", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Kontaktperson <span className="text-red-400">*</span>
            </label>
            <input required type="text" placeholder="Anna Svensson" value={form.kund_kontaktperson}
              onChange={(e) => update("kund_kontaktperson", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Boende <span className="normal-case font-normal">(valfritt)</span>
            </label>
            <input type="text" placeholder="Erik Svensson" value={form.boende_namn}
              onChange={(e) => update("boende_namn", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              E-post <span className="text-red-400">*</span>
            </label>
            <input required type="email" placeholder="din@email.se" value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Telefon <span className="normal-case font-normal">(valfritt)</span>
            </label>
            <input type="tel" placeholder="070-000 00 00" value={form.telefon}
              onChange={(e) => update("telefon", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Önskat inflyttningsdatum <span className="text-red-400">*</span>
            </label>
            <input required type="date" min={minDatum} value={form.startdatum}
              onChange={(e) => update("startdatum", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors" />
            <p className="text-xs text-gray-400 mt-1.5">
              Bokning löper tills vidare från inflyttningsdatum
            </p>
          </div>

          {/* AVTALSTYP */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
              Avtalstyp
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["medlemskap", "standard", "premium"] as Avtalstyp[]).map((typ) => {
                const selected = form.avtalstyp === typ;
                const labels: Record<Avtalstyp, { title: string; desc: string }> = {
                  medlemskap: { title: "Medlemskap", desc: "Grundläggande avtal" },
                  standard: { title: "Standard", desc: "Vanligast valt" },
                  premium: { title: "Premium", desc: "Fullt service" },
                };
                return (
                  <button
                    key={typ}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avtalstyp: typ }))}
                    className={`text-left p-3 rounded-xl border-2 transition-colors ${
                      selected
                        ? "border-[#2D7A4F] bg-[#e8f5ee]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${selected ? "text-[#2D7A4F]" : "text-[#1a1a1a]"}`}>
                      {labels[typ].title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{labels[typ].desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {fel && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{fel}</div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!form.kund_kontaktperson || !form.email || !form.startdatum || skickar}
              className="w-full bg-[#2D7A4F] text-white text-sm py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {skickar ? "Skickar förfrågan..." : "Skicka bokningsförfrågan"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">Ingen betalning krävs ännu</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RumSida({ rumId }: { rumId: string }) {
  const [rum, setRum] = useState<Rum | null>(null);
  const [laddar, setLaddar] = useState(true);
  const [visaModal, setVisaModal] = useState(false);
  const [bokad, setBokad] = useState(false);

  useEffect(() => {
    fetch(`/api/rum/${rumId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setRum(data);
        setLaddar(false);
      })
      .catch(() => {
        setRum(null);
        setLaddar(false);
      });
  }, [rumId]);

  if (laddar) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Hämtar rum...</p>
        </div>
      </main>
    );
  }

  if (!rum) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1a1a1a]">Rum hittades inte</p>
          <Link href="/bostader" className="text-[#2D7A4F] text-sm mt-4 block hover:underline">
            ← Tillbaka till bostäder
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = getRumStatusLabel(rum.bokningar);
  const minDatum = getForstaLedigaDatum(rum.bokningar);

  const statusBadgeClass =
    statusInfo.color === "green"
      ? "bg-green-50 text-green-700"
      : statusInfo.color === "yellow"
      ? "bg-yellow-50 text-yellow-700"
      : "bg-red-50 text-red-700";

  const kanBokas =
    statusInfo.color !== "gray" ||
    minDatum < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5).toISOString().split("T")[0];

  return (
    <>
      <main className="min-h-screen bg-[#F8F7F4]">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <Link
            href={`/bostad/${rum.bostad.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D7A4F] hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till {rum.bostad.namn}
          </Link>

          <div className="grid md:grid-cols-5 gap-8">
            {/* VÄNSTER */}
            <div className="md:col-span-3">
              {/* BILDGALLERI */}
              <Bildgalleri bilder={rum.bilder} alt={rum.namn} placeholder="🛏" />

              {/* RUBRIK + STATUS */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a1a1a]">{rum.namn}</h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {rum.bostad.namn}{rum.bostad.stadsdel ? ` · ${rum.bostad.stadsdel}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${statusBadgeClass}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* FAKTA-CHIPS */}
              <div className="flex flex-wrap gap-2 mb-6">
                {rum.kvm && (
                  <span className="text-xs font-medium bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full">
                    {rum.kvm} kvm
                  </span>
                )}
                <span className="text-xs font-semibold bg-[#e8f5ee] text-[#2D7A4F] px-3 py-1.5 rounded-full">
                  {rum.manadshyra.toLocaleString()} kr/mån
                </span>
              </div>

              {rum.beskrivning && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                  <h2 className="font-semibold text-[#1a1a1a] mb-3">Om rummet</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">{rum.beskrivning}</p>
                </div>
              )}

              {rum.moblering.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="font-semibold text-[#1a1a1a] mb-4">Möblering</h2>
                  <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {rum.moblering.map((m) => (
                      <li key={m} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D7A4F] shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* HÖGER — Bokningsbox */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                {/* Status-cirkel ovanför priset */}
                <div className="flex items-center gap-3 mb-4">
                  <StatusCirkelStor color={statusInfo.color as "green" | "yellow" | "gray"} />
                  <div>
                    <p className={`text-sm font-semibold ${statusInfo.color === "green" ? "text-green-700" : statusInfo.color === "yellow" ? "text-yellow-700" : "text-red-600"}`}>
                      {statusInfo.label}
                    </p>
                    <p className="text-xs text-gray-400">Tillgänglighet</p>
                  </div>
                </div>

                <p className="text-2xl font-bold text-[#2D7A4F]">{rum.manadshyra.toLocaleString()} kr</p>
                <p className="text-xs text-gray-400 mb-1">per månad</p>
                {rum.kvm && <p className="text-xs text-gray-400 mb-5">{rum.kvm} kvm</p>}
                {!rum.kvm && <div className="mb-5" />}

                {bokad ? (
                  <div className="bg-[#e8f5ee] rounded-xl p-4 text-center">
                    <p className="text-[#2D7A4F] font-semibold text-sm">✓ Förfrågan skickad!</p>
                    <p className="text-xs text-gray-400 mt-1">Vi återkommer inom 3 timmar.</p>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setVisaModal(true)} disabled={!kanBokas}
                      className="w-full bg-[#2D7A4F] text-white text-sm py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium mb-3">
                      Skicka bokningsförfrågan
                    </button>
                    {!kanBokas && (
                      <p className="text-xs text-gray-400 text-center">Rummet är för tillfället ej tillgängligt</p>
                    )}
                  </>
                )}

                {/* KONTAKTPERSON */}
                <div className="border-t border-gray-100 mt-5 pt-5">
                  {rum.bostad.kontaktperson_namn ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e8f5ee] overflow-hidden shrink-0 flex items-center justify-center text-sm">
                        {rum.bostad.kontaktperson_bild ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rum.bostad.kontaktperson_bild} alt={rum.bostad.kontaktperson_namn} className="w-full h-full object-cover" />
                        ) : "👤"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1a1a1a] truncate">{rum.bostad.kontaktperson_namn}</p>
                        <p className="text-xs text-gray-400 mb-2">Svarar inom 3 timmar</p>
                        {rum.bostad.kontaktperson_telefon && (
                          <a href={`tel:${rum.bostad.kontaktperson_telefon}`} className="block text-xs text-[#2D7A4F] hover:underline truncate">
                            {rum.bostad.kontaktperson_telefon}
                          </a>
                        )}
                        {rum.bostad.kontaktperson_email && (
                          <a href={`mailto:${rum.bostad.kontaktperson_email}`} className="block text-xs text-[#2D7A4F] hover:underline truncate">
                            {rum.bostad.kontaktperson_email}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e8f5ee] flex items-center justify-center text-sm">👤</div>
                      <div>
                        <p className="text-xs font-semibold text-[#1a1a1a]">Svarar inom 3 timmar</p>
                        <p className="text-xs text-gray-400">Verifierad uthyrare</p>
                      </div>
                    </div>
                  )}
                </div>

                {statusInfo.color !== "gray" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    <p>
                      Första möjliga inflyttning:{" "}
                      <span className="font-medium text-[#1a1a1a]">
                        {formateraDatum(new Date(minDatum))}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {visaModal && (
        <BokningsModal
          rum={rum}
          onClose={() => setVisaModal(false)}
          onSuccess={() => { setVisaModal(false); setBokad(true); }}
        />
      )}
    </>
  );
}
