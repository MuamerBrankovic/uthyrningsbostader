import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Om oss",
  description:
    "Lär känna grundarna bakom Home for Us — Mahir och Ako — och varför vi startade en plattform för företagsbostäder i Linköping och Norrköping.",
};

export default function OmOss() {
  return (
    <main className="min-h-screen bg-[#F8F7F4]">

      {/* HERO */}
      <section className="bg-white border-b border-gray-100 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Om oss</span>
          <h1 className="text-4xl font-bold text-[#1a1a1a] mt-3 mb-5">Vi byggde det vi saknade</h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Home for Us grundades av Mahir och Ako efter att de själva upplevt hur frustrerande det är
            att hitta bra, flexibla bostäder till konsulter på uppdrag. Vi ville göra det enkelt — på riktigt.
          </p>
        </div>
      </section>

      {/* GRUNDARE */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-12 text-center">Grundarna</h2>
        <div className="grid md:grid-cols-2 gap-8">

          {/* Mahir */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="w-16 h-16 rounded-full bg-[#e8f5ee] flex items-center justify-center text-[#2D7A4F] font-bold text-2xl mb-5">
              M
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a]">Mahir</h3>
            <p className="text-sm text-[#2D7A4F] font-medium mb-4">Kundrelationer &amp; fastigheter</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Mahir ansvarar för kundrelationer, hyresvärdar och det dagliga nätverket av bostäder.
              Med bakgrund inom fastigheter och servicebranschen vet han vad som krävs för att både
              hyresgäst och hyresvärd ska känna sig trygga. Han är den som lyfter luren när det
              behövs — och löser det som behöver lösas.
            </p>
          </div>

          {/* Ako */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="w-16 h-16 rounded-full bg-[#e8f5ee] flex items-center justify-center text-[#2D7A4F] font-bold text-2xl mb-5">
              A
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a]">Ako</h3>
            <p className="text-sm text-[#2D7A4F] font-medium mb-4">Digitalt &amp; marknad</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Ako driver den digitala sidan av Home for Us — plattformen, marknadsföringen och
              den tekniska infrastrukturen. Han tror på att teknik ska förenkla, inte krångla till,
              och bygger system som gör att resten av teamet kan fokusera på det mänskliga.
            </p>
          </div>
        </div>
      </section>

      {/* VÅR HISTORIA */}
      <section className="bg-white border-y border-gray-100 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Vår historia</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3 mb-6">Från frustration till plattform</h2>
          <div className="space-y-5 text-gray-600 text-sm leading-relaxed">
            <p>
              Det hela började med ett enkelt problem: en bekant konsultbyrå sökte bostäder till
              sina konsulter i Linköping inför ett 6-månaders uppdrag. Alternativen var antingen
              dyra hotell, opålitliga Airbnb-lösningar eller långa privata hyreskontrakt som
              ingen ville skriva under.
            </p>
            <p>
              Mahir och Ako insåg att det saknades en seriös aktör som förstod B2B-logiken:
              flexibla avtal, en enda faktura och en kontaktperson att ringa. Inte en app att
              navigera. Inte 14 hyresvärdar att förhandla med.
            </p>
            <p>
              Home for Us lanserades 2026 med fokus på Linköping och Norrköping — två städer
              med stark tillväxt inom tech, industri och offentlig sektor, och ett konstant
              inflöde av konsulter på uppdrag.
            </p>
          </div>
        </div>
      </section>

      {/* VAD VI TROR PÅ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Våra värderingar</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3">Vad vi tror på</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              titel: "Enkelhet framför allt",
              text: "Bostad-logistik ska inte kräva en projektledare. Vi tar den bördan och levererar ett enkelt svar.",
            },
            {
              titel: "Lokal kunskap",
              text: "Vi vet vilka gator som är bra, vilka hyresvärdar som är pålitliga och vilka bostäder som håller vad de lovar.",
            },
            {
              titel: "Långsiktiga relationer",
              text: "Vi vill vara er fasta partner — inte en engångslösning. Det bygger vi på tillit, transparens och ärlighet.",
            },
          ].map((v) => (
            <div key={v.titel} className="bg-white rounded-2xl border border-gray-100 p-7">
              <div className="w-8 h-8 rounded-full bg-[#e8f5ee] mb-4" />
              <h3 className="font-semibold text-[#1a1a1a] mb-2">{v.titel}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2D7A4F] py-16 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Vill du veta mer?</h2>
          <p className="text-green-100 text-sm mb-8">
            Vi berättar gärna mer om hur vi kan hjälpa just er verksamhet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:info@homeforus.se"
              className="inline-block bg-white text-[#2D7A4F] text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              Kontakta oss
            </a>
            <Link
              href="/bostader"
              className="inline-block border border-white/40 text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              Se bostäder
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
