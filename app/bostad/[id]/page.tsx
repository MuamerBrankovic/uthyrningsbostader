"use client";
import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import Bildgalleri from "@/app/components/Bildgalleri";
import BildPlatshallare from "@/app/components/BildPlatshallare";
import { formateraDatum, formateraKortDatum } from "@/lib/datum";
import {
  BedDouble,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  CalendarDays,
  MapPin,
  ArrowLeft,
} from "lucide-react";

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

// ─── Status-badge (text) ──────────────────────────────────────────────────────

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
    <span className="inline-block text-xs font-semibold bg-red-100 text-red-500 px-3 py-1 rounded-full whitespace-nowrap">
      {status.slutdatum ? `Bokat till ${formateraKortDatum(status.slutdatum)}` : "Bokat"}
    </span>
  );
}

// ─── Status-cirkel (ikon) ─────────────────────────────────────────────────────

function StatusCirkel({ status }: { status: RumStatus }) {
  if (status.typ === "ledig") {
    return (
      <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow">
        <CheckCircle className="w-4 h-4 text-white" />
      </span>
    );
  }
  if (status.typ === "ledigt-fran") {
    return (
      <span className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow">
        <Clock className="w-4 h-4 text-white" />
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow">
      <XCircle className="w-4 h-4 text-white" />
    </span>
  );
}

// ─── Faktarad ────────────────────────────────────────────────────────────────

function Faktarad({ bostad }: { bostad: Bostad }) {
  const ledigaRum = bostad.rum.filter((r) => getRumStatus(r).typ === "ledig").length;
  const narmstLedigt = getNarmstaLedigaDatum(bostad.rum);

  const stats = [
    {
      label: "Antal rum",
      value: String(bostad.rum.length),
      grön: false,
      icon: <BedDouble className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" />,
    },
    {
      label: "Lediga just nu",
      value: String(ledigaRum),
      grön: ledigaRum > 0,
      icon: <Users className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" />,
    },
    {
      label: "Närmst ledigt",
      value: narmstLedigt,
      grön: false,
      icon: <CalendarDays className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" />,
    },
    {
      label: "Närmaste hållplats",
      value: bostad.narmaste_hallplats ?? "—",
      grön: false,
      icon: <MapPin className="w-5 h-5 text-[#2D7A4F] mx-auto mb-2" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#e8f5ee] rounded-2xl p-5 text-center">
          {s.icon}
          <p className={`text-2xl font-bold ${s.grön ? "text-green-600" : "text-[#2D7A4F]"}`}>
            {s.value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Popup-innehåll ───────────────────────────────────────────────────────────

function getPopupContent(status: RumStatus): { text: string; knappText: string | null } {
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

// ─── Rumkort med hover-overlay + mobilbottomsheet ─────────────────────────────

function RumKort({ rum }: { rum: Rum }) {
  const [hovering, setHovering] = useState(false);
  const [bottomSheet, setBottomSheet] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const status = getRumStatus(rum);
  const { text, knappText } = getPopupContent(status);
  const cta = knappText ?? "Visa rum";

  useEffect(() => {
    if (!bottomSheet) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const insideCard = containerRef.current?.contains(target);
      const insideSheet = sheetRef.current?.contains(target);
      if (!insideCard && !insideSheet) {
        setBottomSheet(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [bottomSheet]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative group"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <Link
          href={`/rum/${rum.id}`}
          className={`block bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 ${
            hovering ? "shadow-md -translate-y-0.5" : "shadow-sm"
          }`}
        >
          {/* ── Bild ─── */}
          <div className="relative h-52 overflow-hidden">
            {rum.bilder.length > 0 ? (
              <Image
                src={rum.bilder[0]}
                alt={rum.namn}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <BildPlatshallare className="absolute inset-0" text="Bild saknas" />
            )}

            {/* Status-cirkel */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <StatusCirkel status={status} />
            </div>

            {/* Info-knapp mobil */}
            <button
              className="absolute bottom-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full text-white text-sm font-bold transition-colors md:hidden z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBottomSheet((v) => !v);
              }}
              aria-label="Visa tillgänglighetsinformation"
            >
              i
            </button>

            {/* Hover-overlay (desktop) — glider upp från botten */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm px-4 pt-3 pb-4 transition-all duration-200 hidden md:block ${
                hovering ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <StatusCirkel status={status} />
                <StatusBadge status={status} />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{text}</p>
              <span className="block w-full text-center bg-[#2D7A4F] text-white text-xs font-semibold py-2.5 rounded-xl">
                {cta}
              </span>
            </div>
          </div>

          {/* ── Info-rad ─── */}
          <div className="p-4">
            <h3 className="font-semibold text-[#1a1a1a] mb-1">{rum.namn}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              {rum.kvm && <span>{rum.kvm} kvm</span>}
              {rum.kvm && <span>·</span>}
              <span className="font-semibold text-[#2D7A4F]">
                från {rum.manadshyra.toLocaleString()} kr/mån
              </span>
            </div>
            <StatusBadge status={status} />
          </div>
        </Link>
      </div>

      {/* Bottom sheet — mobil */}
      {bottomSheet && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setBottomSheet(false)}>
          <div
            ref={sheetRef}
            className="w-full bg-white rounded-t-2xl shadow-xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-3">
              <StatusCirkel status={status} />
              <div>
                <p className="font-semibold text-[#1a1a1a] text-sm">{rum.namn}</p>
                <StatusBadge status={status} />
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{text}</p>
            <Link
              href={`/rum/${rum.id}`}
              className="block w-full text-center bg-[#2D7A4F] text-white text-sm font-semibold py-3.5 rounded-xl"
              onClick={() => setBottomSheet(false)}
            >
              {cta}
            </Link>
          </div>
        </div>
      )}
    </>
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
      {/* ── HERO-BILD ────────────────────────────────────────────────── */}
      <div className="relative h-[250px] md:h-[400px] w-full overflow-hidden">
        {bostad.bilder.length > 0 ? (
          <Image
            src={bostad.bilder[0]}
            alt={bostad.namn}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <BildPlatshallare className="absolute inset-0" />
        )}
        {/* Mörk gradient-overlay längst ner */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow">{bostad.namn}</h1>
          {(bostad.stadsdel || bostad.adress) && (
            <p className="text-white/80 text-sm mt-1 drop-shadow">
              {[bostad.stadsdel, bostad.adress].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <Link
          href="/bostader"
          className="inline-flex items-center gap-1.5 text-sm text-[#2D7A4F] hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till alla bostäder
        </Link>

        {/* FAKTARAD */}
        <Faktarad bostad={bostad} />

        {/* BILDGALLERI */}
        {bostad.bilder.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">
              Delade utrymmen och bostaden
            </h2>
            <Bildgalleri
              bilder={
                bostad.bilder.length > 1
                  ? [...bostad.bilder.slice(1), bostad.bilder[0]]
                  : bostad.bilder
              }
              alt={bostad.namn}
            />
          </div>
        )}

        {/* INFO-KORT */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {bostad.beskrivning && (
            <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">Om bostaden</h2>
              <p className="text-base text-gray-700 leading-relaxed">{bostad.beskrivning}</p>
            </div>
          )}

          {bostad.delade_utrymmen.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Delade utrymmen</h2>
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
              <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Vad ingår</h2>
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
              <h2 className="text-2xl font-bold text-[#1a1a1a]">
                Tillgängliga rum
                {ledigaRum > 0 && (
                  <span className="ml-3 text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full align-middle">
                    {ledigaRum} {ledigaRum === 1 ? "ledigt" : "lediga"}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">
                Håll muspekaren över ett rum för statusinformation
              </p>
              <p className="text-sm text-gray-500 mt-1 md:hidden">
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
