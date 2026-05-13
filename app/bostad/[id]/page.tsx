"use client";
import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Bildgalleri from "@/app/components/Bildgalleri";
import { formateraDatum, formateraKortDatum } from "@/lib/datum";

// ─── Typer ───────────────────────────────────────────────────────────────────

type Bokning = {
  id: string;
  startdatum: string;
  slutdatum: string | null;
  status: string;
};

type Rum = {
  id: string;
  namn: string;
  bilder: string[];
  kvm: number | null;
  manadshyra: number;
  status: string;
  bokningar: Bokning[];
};

type Bostad = {
  id: string;
  namn: string;
  adress: string | null;
  stadsdel: string | null;
  beskrivning: string | null;
  bilder: string[];
  delade_utrymmen: string[];
  inkluderat: string[];
  narmaste_hallplats: string | null;
  rum: Rum[];
};

type RumStatus =
  | { typ: "ledig" }
  | { typ: "ledigt-fran"; datum: Date }
  | { typ: "bokat"; slutdatum: Date | null };

// ─── Status-helpers ───────────────────────────────────────────────────────────

function getRumStatus(rum: Rum): RumStatus {
  const active = rum.bokningar.filter((b) => {
    if (b.status === "avbokad") return false;
    if (!b.slutdatum) return true;
    return new Date(b.slutdatum) > new Date();
  });

  if (active.length === 0) return { typ: "ledig" };

  const hasIndefinite = active.some((b) => !b.slutdatum);
  if (hasIndefinite) return { typ: "bokat", slutdatum: null };

  const latest = active.reduce<Date>((max, b) => {
    const d = new Date(b.slutdatum!);
    return d > max ? d : max;
  }, new Date(0));

  const fran = new Date(latest);
  fran.setDate(fran.getDate() + 1);
  return { typ: "ledigt-fran", datum: fran };
}

function getNarmstaLedigaDatum(rum: Rum[]): string {
  if (rum.length === 0) return "—";
  if (rum.some((r) => getRumStatus(r).typ === "ledig")) return "Idag";

  const dates = rum
    .map((r) => getRumStatus(r))
    .filter((s): s is { typ: "ledigt-fran"; datum: Date } => s.typ === "ledigt-fran")
    .map((s) => s.datum);

  if (dates.length === 0) return "—";
  const earliest = dates.reduce((min, d) => (d < min ? d : min));
  return formateraKortDatum(earliest);
}

// ─── Status-badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RumStatus }) {
  if (status.typ === "ledig") {
    return (
      <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full whitespace-nowrap">
        Ledigt nu
      </span>
    );
  }
  if (status.typ === "ledigt-fran") {
    return (
      <span className="inline-block text-xs font-semibold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full whitespace-nowrap">
        Ledigt från {formateraKortDatum(status.datum)}
      </span>
    );
  }
  return (
    <span className="inline-block text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1 rounded-full whitespace-nowrap">
      {status.slutdatum ? `Bokat till ${formateraKortDatum(status.slutdatum)}` : "Bokat"}
    </span>
  );
}

// ─── Faktarad ────────────────────────────────────────────────────────────────

function Faktarad({ bostad }: { bostad: Bostad }) {
  const ledigaRum = bostad.rum.filter((r) => getRumStatus(r).typ === "ledig").length;
  const narmstLedigt = getNarmstaLedigaDatum(bostad.rum);

  const stats = [
    { label: "Antal rum", value: String(bostad.rum.length), grön: false },
    { label: "Lediga just nu", value: String(ledigaRum), grön: ledigaRum > 0 },
    { label: "Närmst ledigt", value: narmstLedigt, grön: false },
    { label: "Närmaste hållplats", value: bostad.narmaste_hallplats ?? "—", grön: false },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#e8f5ee] rounded-2xl p-5 text-center">
          <p className={`text-2xl font-bold ${s.grön ? "text-green-600" : "text-[#2D7A4F]"}`}>
            {s.value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Rumkort med hover/tap-popup ─────────────────────────────────────────────

function getPopupContent(
  status: RumStatus
): { text: string; knappText: string | null } {
  if (status.typ === "ledig") {
    return {
      text: "Tillgängligt direkt. Boka från valfritt datum från och med idag.",
      knappText: "Boka rum",
    };
  }

  if (status.typ === "ledigt-fran") {
    return {
      text: `Blir tillgängligt ${formateraDatum(status.datum)}. Boka från och med detta datum.`,
      knappText: `Boka från ${formateraKortDatum(status.datum)}`,
    };
  }

  // bokat
  if (status.slutdatum) {
    const nasta = new Date(status.slutdatum);
    nasta.setDate(nasta.getDate() + 1);
    return {
      text: `För närvarande bokat till och med ${formateraDatum(status.slutdatum)}. Nya bokningar kan göras från ${formateraDatum(nasta)}.`,
      knappText: `Boka från ${formateraKortDatum(nasta)}`,
    };
  }

  return {
    text: "För närvarande bokat tills vidare. Kontakta oss för mer information.",
    knappText: null,
  };
}

function RumKort({ rum }: { rum: Rum }) {
  const [hovering, setHovering] = useState(false);
  const [tapped, setTapped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const status = getRumStatus(rum);
  const popupOpen = hovering || tapped;
  const { text, knappText } = getPopupContent(status);

  // Stäng popup vid tap utanför (mobil)
  useEffect(() => {
    if (!tapped) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTapped(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [tapped]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* ─── Kort ─────────────────────────────────────────── */}
      <Link
        href={`/rum/${rum.id}`}
        className="block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
      >
        {/* Bild */}
        <div className="h-40 bg-[#e8f5ee] flex items-center justify-center relative overflow-hidden">
          {rum.bilder.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rum.bilder[0]} alt={rum.namn} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#2D7A4F] opacity-40 text-4xl">🛏</span>
          )}

          {/* Info-ikon — visas bara på mobil (md:hidden) */}
          <button
            className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full text-white text-sm font-bold transition-colors md:hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTapped((v) => !v);
            }}
            aria-label="Visa tillgänglighetsinformation"
          >
            i
          </button>
        </div>

        {/* Text */}
        <div className="p-4">
          <h3 className="font-semibold text-[#1a1a1a] text-sm mb-1">{rum.namn}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            {rum.kvm && <span>{rum.kvm} kvm</span>}
            {rum.kvm && <span>·</span>}
            <span className="font-semibold text-[#2D7A4F]">
              {rum.manadshyra.toLocaleString()} kr/mån
            </span>
          </div>
          <StatusBadge status={status} />
        </div>
      </Link>

      {/* ─── Popup ────────────────────────────────────────── */}
      <div
        className={`absolute bottom-full left-0 right-0 mb-2 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-4 transition-opacity duration-150 ${
          popupOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Badge + rubrik */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-[#1a1a1a] leading-tight">{rum.namn}</p>
          <StatusBadge status={status} />
        </div>

        {/* Text */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{text}</p>

        {/* Knapp */}
        {knappText && (
          <Link
            href={`/rum/${rum.id}`}
            className="block w-full text-center bg-[#2D7A4F] text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-[#225f3d] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {knappText}
          </Link>
        )}

        {/* Nedåtpil */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200" />
      </div>
    </div>
  );
}

// ─── Huvudkomponent ───────────────────────────────────────────────────────────

export default function BostadSida({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [bostad, setBostad] = useState<Bostad | null>(null);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    fetch(`/api/bostader/${resolvedParams.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setBostad(data);
        setLaddar(false);
      })
      .catch(() => {
        setBostad(null);
        setLaddar(false);
      });
  }, [resolvedParams.id]);

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
          <Link href="/bostader" className="text-[#2D7A4F] text-sm mt-4 block hover:underline">
            ← Tillbaka till alla bostäder
          </Link>
        </div>
      </main>
    );
  }

  const ledigaRum = bostad.rum.filter((r) => getRumStatus(r).typ === "ledig").length;

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <Link href="/bostader" className="text-sm text-[#2D7A4F] hover:underline mb-8 block">
          ← Tillbaka till alla bostäder
        </Link>

        {/* HERO-BILDGALLERI */}
        <div className="relative mb-8">
          <Bildgalleri bilder={bostad.bilder} alt={bostad.namn} />
          {ledigaRum > 0 && (
            <span className="absolute top-4 left-4 text-xs font-semibold bg-white text-[#2D7A4F] px-4 py-1.5 rounded-full border border-[#c8e8d8] shadow-sm z-10">
              {ledigaRum} ledigt rum
            </span>
          )}
        </div>

        {/* RUBRIK */}
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">{bostad.namn}</h1>
        <p className="text-gray-400 mb-8">
          {[bostad.stadsdel, bostad.adress].filter(Boolean).join(" · ")}
        </p>

        {/* FAKTARAD */}
        <Faktarad bostad={bostad} />

        {/* INFO-KORT */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {bostad.beskrivning && (
            <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-[#1a1a1a] mb-3">Om bostaden</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{bostad.beskrivning}</p>
            </div>
          )}

          {bostad.delade_utrymmen.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-[#1a1a1a] mb-4">Delade utrymmen</h2>
              <ul className="space-y-2">
                {bostad.delade_utrymmen.map((u) => (
                  <li key={u} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D7A4F] shrink-0" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bostad.inkluderat.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-[#1a1a1a] mb-4">Vad ingår</h2>
              <div className="flex flex-wrap gap-2">
                {bostad.inkluderat.map((item) => (
                  <span
                    key={item}
                    className="text-xs font-medium bg-[#e8f5ee] text-[#2D7A4F] px-3 py-1.5 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RUMSGRID */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a1a]">Tillgängliga rum</h2>
              <p className="text-gray-400 text-sm mt-1 hidden md:block">
                Håll muspekaren över ett rum för statusinformation
              </p>
              <p className="text-gray-400 text-sm mt-1 md:hidden">
                Tryck på <span className="font-semibold">i</span>-ikonen för statusinformation
              </p>
            </div>
          </div>

          {bostad.rum.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400">Inga rum tillagda ännu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bostad.rum.map((rum) => (
                <RumKort key={rum.id} rum={rum} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
