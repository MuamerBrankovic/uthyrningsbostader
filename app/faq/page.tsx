"use client";
import { useState } from "react";

const sektioner = [
  {
    rubrik: "För företag",
    fragor: [
      {
        f: "Hur snabbt kan vi få en bostad?",
        s: "I de flesta fall kan vi presentera alternativ inom 24 timmar och skriva avtal inom 48 timmar. Beroende på tillgänglighet och krav kan det ibland gå snabbare.",
      },
      {
        f: "Hur långa avtal erbjuder ni?",
        s: "Vi erbjuder avtal från 1 månad och uppåt. Avtalet anpassas till er konsults uppdragslängd och kan förlängas löpande.",
      },
      {
        f: "Kan vi hyra flera bostäder samtidigt?",
        s: "Absolut. Många av våra kunder hanterar flera konsulter parallellt. Vi koordinerar allt och skickar en samlad faktura.",
      },
      {
        f: "Vad ingår i hyran?",
        s: "Alla bostäder är fullt möblerade och inkluderar WiFi och hushållsel. Exakt vad som ingår framgår av varje bostad. Städning och tvätt kan läggas till i Premium-paketet.",
      },
      {
        f: "Hur faktureras vi?",
        s: "Ni faktureras månadsvis per bostad. Vi erbjuder samlad faktura för företag med flera bostäder. Betalning sker mot 30 dagars netto.",
      },
    ],
  },
  {
    rubrik: "För konsulter",
    fragor: [
      {
        f: "Behöver jag personnummer för att hyra?",
        s: "Nej. Avtalet tecknas av ert företag, inte av konsulten privat. Det krävs inget kreditupplysning eller personnummer från konsultens sida.",
      },
      {
        f: "Är bostäderna verkligen möblerade?",
        s: "Ja, fullt möblerade. Det innebär säng med sängkläder, skrivbord, sittgrupp, köksutrustning och WiFi. Du behöver bara ta med personliga tillhörigheter.",
      },
      {
        f: "Kan jag ta med husdjur?",
        s: "Det beror på hyresvärden. Fråga oss när du kontaktar oss så undersöker vi vad som är möjligt.",
      },
      {
        f: "Vad händer om något går sönder?",
        s: "Kontakta din tilldelade kontaktperson på ReLoka. Vi koordinerar med hyresvärden och ser till att det löses snabbt.",
      },
    ],
  },
  {
    rubrik: "För hyresvärdar",
    fragor: [
      {
        f: "Vem hyr min bostad?",
        s: "Vi matchar din bostad med seriösa företagshyresgäster — konsulter och tjänsteresenärer vars arbetsgivare står för hyran. Det innebär stabil och trygg hyresinkomst.",
      },
      {
        f: "Hur lång är bindningstiden för mig som hyresvärd?",
        s: "Du väljer vilka perioder du vill hyra ut. Vi har inga krav på exklusivitet, men de som erbjuder kontinuerlig tillgänglighet prioriteras i vår matchning.",
      },
      {
        f: "Vad kräver ni av bostaden?",
        s: "Bostaden ska vara fullt möblerad, ha fungerande WiFi och vara i gott skick. Vi gör alltid en besiktning innan vi listar en bostad.",
      },
      {
        f: "Hur anmäler jag min bostad?",
        s: "Fyll i formuläret på vår sida för hyresvärdar, eller ring oss direkt. Vi återkommer inom 24 timmar.",
      },
    ],
  },
];

function AccordionItem({ fraga, svar }: { fraga: string; svar: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full text-left flex items-center justify-between py-4 px-0 gap-4"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-[#1a1a1a] leading-snug">{fraga}</span>
        <span
          className={`shrink-0 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 transition-transform ${open ? "rotate-45" : ""}`}
          aria-hidden
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="5" y1="0" x2="5" y2="10" />
            <line x1="0" y1="5" x2="10" y2="5" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4">{svar}</p>
      )}
    </div>
  );
}

export default function Faq() {
  return (
    <main className="min-h-screen bg-[#F8F7F4]">

      <section className="bg-white border-b border-gray-100 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">FAQ</span>
          <h1 className="text-4xl font-bold text-[#1a1a1a] mt-3 mb-4">Vanliga frågor</h1>
          <p className="text-gray-500 text-sm">
            Hittar du inte svaret du söker? Kontakta oss direkt på{" "}
            <a href="mailto:info@reloka.se" className="text-[#2D7A4F] hover:underline">
              info@reloka.se
            </a>
            .
          </p>
        </div>
      </section>

      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="space-y-10">
          {sektioner.map((s) => (
            <div key={s.rubrik}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F] mb-5">
                {s.rubrik}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 px-6">
                {s.fragor.map((q) => (
                  <AccordionItem key={q.f} fraga={q.f} svar={q.s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
