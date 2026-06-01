import type { Metadata } from "next";
import Link from "next/link";
import OffertKnapp from "@/app/components/OffertKnapp";

export const metadata: Metadata = {
  title: "ReLoka — Företagsbostäder i Linköping och Norrköping",
  description:
    "Möblerade bostäder för konsulter och tjänsteresenärer i Linköping och Norrköping. Flexibla avtal, fullt möblerat, ingen mäklare.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F7F4] font-sans">

      {/* HERO */}
      <section className="px-6 pt-20 pb-24 max-w-5xl mx-auto text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#2D7A4F] bg-[#e8f5ee] px-4 py-1.5 rounded-full mb-6">
          Linköping &amp; Norrköping
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] leading-tight mb-6">
          Företagsbostäder utan<br className="hidden md:block" />
          <span className="text-[#2D7A4F]"> krångel eller mäklare</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-10">
          Vi hjälper HR-chefer och konsultansvariga att snabbt hitta möblerade bostäder till sina konsulter —
          med flexibla avtal och personlig service.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <OffertKnapp />
          <Link
            href="/bostader"
            className="inline-block bg-white border border-gray-200 text-[#1a1a1a] text-sm font-medium px-8 py-3.5 rounded-full hover:border-[#2D7A4F] transition-colors"
          >
            Utforska bostäder
          </Link>
        </div>
      </section>

      {/* PROBLEM / LÖSNING */}
      <section id="for-foretag" className="bg-white border-y border-gray-100 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Varför ReLoka?</span>
              <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3 mb-6">
                Att hitta bostad till konsulter<br />är ett heltidsjobb i sig
              </h2>
              <ul className="space-y-4 text-gray-600 text-sm">
                {[
                  "Hotell är dyrt och opersonligt vid uppdrag längre än en vecka.",
                  "Privata hyresvärdar kräver lång bindningstid och personnummer.",
                  "Korttidskontrakt är svåra att hitta och ta tar tid att förhandla.",
                  "HR lägger timmar på att koordinera logistik istället för folk.",
                ].map((s) => (
                  <li key={s} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs">✕</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#F8F7F4] rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-5">Med ReLoka istället:</h3>
              <ul className="space-y-4 text-gray-700 text-sm">
                {[
                  "Fullt möblerade bostäder redo att flytta in i — direkt.",
                  "Flexibla avtal från 1 månad, anpassade till konsultuppdrag.",
                  "En kontaktperson som löser allt. Ni betalar en faktura.",
                  "Tryggad hyresvärd, besiktat boende, inkl. wifi och hushållsel.",
                ].map((s) => (
                  <li key={s} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#e8f5ee] text-[#2D7A4F] flex items-center justify-center text-xs font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <OffertKnapp variant="small" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOSTADSTYPER */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Utbud</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3">Tre typer av boende</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">Välj det alternativ som passar konsultens behov och er budget.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              titel: "Privat rum",
              pris: "från 9 000 kr/mån",
              desc: "Eget rum i ett kollektivboende med delat kök och badrum. Perfekt för kortare uppdrag och mer social tillvaro.",
              inkl: ["Möblerat rum", "Delat kök", "Delade badrum", "WiFi inkl.", "El inkl."],
              href: "/bostader?typ=privat_rum",
            },
            {
              titel: "Rum med eget bad",
              pris: "från 12 000 kr/mån",
              desc: "Eget rum med privat badrum i ett gemensamt boende. Integritet och bekvämlighet i ett.",
              inkl: ["Möblerat rum", "Privat badrum", "Delat kök", "WiFi inkl.", "El inkl."],
              href: "/bostader?typ=rum_eget_bad",
              featured: true,
            },
            {
              titel: "Hel lägenhet",
              pris: "från 18 000 kr/mån",
              desc: "Komplett möblerad lägenhet för konsulter som föredrar full integritet eller bor med familj.",
              inkl: ["Fullt möblerad", "Privat kök", "Privat badrum", "WiFi inkl.", "El inkl."],
              href: "/bostader?typ=hel_lagenhet",
            },
          ].map((t) => (
            <div
              key={t.titel}
              className={`rounded-2xl p-7 border flex flex-col ${t.featured ? "border-[#2D7A4F] bg-[#f8fdf9] relative" : "border-gray-100 bg-white"}`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2D7A4F] text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Mest populär
                </span>
              )}
              <h3 className="text-lg font-semibold text-[#1a1a1a]">{t.titel}</h3>
              <p className="text-[#2D7A4F] font-bold mt-1 mb-3">{t.pris}</p>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">{t.desc}</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6 flex-1">
                {t.inkl.map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#e8f5ee] text-[#2D7A4F] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className={`text-sm text-center py-2.5 rounded-full font-medium transition-colors ${t.featured ? "bg-[#2D7A4F] text-white hover:bg-[#225f3d]" : "border border-gray-200 text-[#1a1a1a] hover:border-[#2D7A4F]"}`}
              >
                Se lediga {t.titel.toLowerCase()}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SÅ FUNGERAR DET */}
      <section className="bg-white border-y border-gray-100 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Processen</span>
            <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3">Så enkelt fungerar det</h2>
            <p className="text-gray-500 mt-2 text-sm">Från kontakt till inflyttning på 48 timmar.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Kontakta oss", desc: "Ring eller mejla — berätta om behov, stad och tidsram." },
              { num: "2", title: "Ni får alternativ", desc: "Vi matchar er med passande bostäder. Inga onödiga rundturer." },
              { num: "3", title: "Avtal skrivs", desc: "Flexibelt avtal, anpassat till konsultuppdraget. Ni betalar en faktura." },
              { num: "4", title: "Inflyttning", desc: "Allt är klart. Konsulten hämtar nyckeln och kan fokusera på jobbet." },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#e8f5ee] text-[#2D7A4F] font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TJÄNSTEPAKET */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Avtal</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3">Välj servicenivå</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto">
            Alla paket inkluderar fullt möblerat boende. Välj den servicenivå som passar er organisation.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              namn: "Medlemskap",
              tagline: "Grundläggande tillgång",
              desc: "Tillgång till hela utbudet med självservice-bokning. Passar företag med intern HR-kapacitet.",
              features: ["Tillgång till alla bostäder", "Digital bokning", "E-postsupport"],
              cta: "Kom igång",
            },
            {
              namn: "Standard",
              tagline: "Rekommenderat",
              desc: "En dedikerad kontaktperson som hanterar hela bokningsprocessen åt er. Vår populäraste plan.",
              features: ["Allt i Medlemskap", "Dedikerad kontaktperson", "Prioriterad support", "Fakturahantering"],
              cta: "Välj Standard",
              featured: true,
            },
            {
              namn: "Premium",
              tagline: "Full service",
              desc: "Vi sköter allt — från bokning till utcheckning och städning. Perfekt för stora konsultbolag.",
              features: ["Allt i Standard", "Inflyttnings­service", "Städning vid utflyttning", "Volymrabatt", "SLA-garanti"],
              cta: "Kontakta oss",
            },
          ].map((p) => (
            <div
              key={p.namn}
              className={`rounded-2xl p-7 border flex flex-col ${p.featured ? "border-[#2D7A4F] bg-[#f8fdf9] relative" : "border-gray-100 bg-white"}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2D7A4F] text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Rekommenderas
                </span>
              )}
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{p.tagline}</span>
              <h3 className="text-xl font-bold text-[#1a1a1a] mt-1 mb-3">{p.namn}</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed flex-1">{p.desc}</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#e8f5ee] text-[#2D7A4F] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <OffertKnapp label={p.cta} variant={p.featured ? "primary" : "outline"} />
            </div>
          ))}
        </div>
      </section>

      {/* VARFÖR LOKALT */}
      <section className="bg-[#1a1a1a] text-white py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">Lokal närvaro</span>
            <h2 className="text-3xl font-bold mt-3 mb-6">
              Vi kan Linköping och Norrköping inifrån och ut
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Till skillnad från nationella plattformar har vi personlig kännedom om varje bostad, varje hyresvärd
              och varje stadsdel i de städer vi verkar i. Det ger er trygghet — och er konsult en bra start.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { num: "48h", label: "Genomsnittlig tid från kontakt till avtal" },
                { num: "100%", label: "Besiktade och godkända bostäder" },
                { num: "1", label: "Faktura per uppdrag — oavsett antal rum" },
                { num: "2h", label: "Svarstid på vardagar" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-[#2D7A4F]">{s.num}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <p className="text-gray-300 text-sm leading-relaxed italic mb-6">
              &ldquo;Vi anlitar konsulter i Linköping regelbundet och ReLoka har sparat oss otaliga timmar
              av letande och administration. Rekommenderas varmt.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2D7A4F] flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <div>
                <p className="text-sm font-medium text-white">Anna K.</p>
                <p className="text-xs text-gray-400">HR-chef, teknikföretag</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HYRESVÄRDAR CTA */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">För hyresvärdar</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-3 mb-4">
            Har du en bostad att hyra ut?
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto mb-8">
            Vi matchar din bostad med seriösa företagshyresgäster. Stabil hyresinkomst,
            tryggade avtal och minimal administration.
          </p>
          <Link
            href="/hyresvardar"
            className="inline-block bg-[#2D7A4F] text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-[#225f3d] transition-colors"
          >
            Läs mer för hyresvärdar
          </Link>
        </div>
      </section>

      {/* KONTAKT CTA */}
      <section className="bg-[#2D7A4F] py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Redo att komma igång?</h2>
          <p className="text-green-100 text-sm mb-8">
            Ring eller mejla oss idag. Inga förpliktelser — bara en snabb dialog om era behov.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:013XXXXXX"
              className="inline-block bg-white text-[#2D7A4F] text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              013-XXX XX XX
            </a>
            <a
              href="mailto:info@reloka.se"
              className="inline-block border border-white/40 text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              info@reloka.se
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111] text-gray-400 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            <div>
              <div className="flex flex-col leading-none mb-3">
                <span className="text-white font-bold text-lg">Re<span className="text-[#2D7A4F]">Loka</span> AB</span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide mt-0.5">Linköping &amp; Norrköping</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                Möblerade företagsbostäder med personlig service. Vi gör boende-logistiken enkel för HR och konsultbolag.
              </p>
              <p className="text-xs text-gray-600 mt-3">Org.nr: under registrering</p>
              <p className="text-xs text-gray-600">Linköping, Sverige</p>
            </div>
            <div className="flex gap-16 text-sm">
              <div className="flex flex-col gap-2">
                <span className="text-white font-medium mb-1 text-xs uppercase tracking-wider">Tjänster</span>
                <Link href="/bostader" className="hover:text-white transition-colors">Hitta bostad</Link>
                <Link href="/hyresvardar" className="hover:text-white transition-colors">Hyra ut bostad</Link>
                <Link href="/#for-foretag" className="hover:text-white transition-colors">För företag</Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-white font-medium mb-1 text-xs uppercase tracking-wider">Företaget</span>
                <Link href="/om-oss" className="hover:text-white transition-colors">Om oss</Link>
                <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
                <a href="mailto:info@reloka.se" className="hover:text-white transition-colors">Kontakt</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-xs text-gray-600 flex flex-col sm:flex-row justify-between gap-2">
            <span>© 2026 ReLoka AB. Alla rättigheter förbehållna.</span>
            <a href="mailto:info@reloka.se" className="hover:text-gray-400 transition-colors">info@reloka.se</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
