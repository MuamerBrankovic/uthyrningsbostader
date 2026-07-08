import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Användarvillkor",
  description:
    "Villkor för användning av reloka.se — ReLoka AB:s webbplats för möblerade företagsbostäder i Linköping och Norrköping.",
};

const H2_CLS = "text-xl font-semibold text-[#1a1a1a] mt-10 mb-3";
const P_CLS = "text-sm text-gray-600 leading-relaxed mb-3";

export default function Villkor() {
  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <section className="bg-white border-b border-gray-100 py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">
            Juridiskt
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-3 mb-3">
            Användarvillkor
          </h1>
          <p className="text-gray-500 text-sm">Senast uppdaterad: 7 juli 2026</p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          <h2 className={`${H2_CLS} mt-0`}>Om tjänsten</h2>
          <p className={P_CLS}>
            reloka.se drivs av ReLoka AB och förmedlar möblerade bostäder för
            företag och deras medarbetare i Linköping och Norrköping. Genom att
            använda webbplatsen godkänner du dessa villkor.
          </p>

          <h2 className={H2_CLS}>Förfrågningar är inte bindande</h2>
          <p className={P_CLS}>
            Boknings- och offertförfrågningar som skickas via webbplatsen är
            intresseanmälningar — de utgör inte ett bindande avtal och ingen
            betalning sker via webbplatsen. Hyresavtal ingås alltid separat och
            skriftligen mellan parterna. Vi återkommer normalt inom 3 timmar på
            vardagar med besked.
          </p>

          <h2 className={H2_CLS}>Priser och tillgänglighet</h2>
          <p className={P_CLS}>
            Hyror anges per månad och avser det som beskrivs på respektive
            bostadssida. Vi strävar efter att information om pris och
            tillgänglighet alltid ska vara aktuell, men den är preliminär tills
            avtal har tecknats och kan ändras utan föregående meddelande.
          </p>

          <h2 className={H2_CLS}>Användarkonto</h2>
          <p className={P_CLS}>
            Du ansvarar för att hålla dina inloggningsuppgifter hemliga och för
            aktivitet som sker via ditt konto. Kontakta oss omgående om du
            misstänker att någon obehörig fått tillgång till kontot. Vi kan stänga
            konton som används i strid med villkoren eller för att störa tjänsten.
          </p>

          <h2 className={H2_CLS}>Personuppgifter</h2>
          <p className={P_CLS}>
            Hur vi behandlar personuppgifter beskrivs i vår{" "}
            <Link href="/integritetspolicy" className="text-[#2D7A4F] hover:underline">
              integritetspolicy
            </Link>
            .
          </p>

          <h2 className={H2_CLS}>Ansvarsbegränsning</h2>
          <p className={P_CLS}>
            Webbplatsen tillhandahålls i befintligt skick. Vi ansvarar inte för
            indirekta skador eller följdskador till följd av användning av
            webbplatsen, i den utsträckning ansvar kan begränsas enligt tvingande
            lag. Innehållet (texter, bilder, varumärket ReLoka) får inte användas
            utan vårt skriftliga tillstånd.
          </p>

          <h2 className={H2_CLS}>Ändringar och tillämplig lag</h2>
          <p className={P_CLS}>
            Vi kan uppdatera villkoren; den senaste versionen publiceras alltid
            här. Svensk lag tillämpas på villkoren och tvister prövas av svensk
            allmän domstol.
          </p>

          <h2 className={H2_CLS}>Kontakt</h2>
          <p className={P_CLS}>
            ReLoka AB, Linköping ·{" "}
            <a href="mailto:info@reloka.se" className="text-[#2D7A4F] hover:underline">
              info@reloka.se
            </a>
          </p>

          <div className="mt-10 pt-6 border-t border-gray-100">
            <Link href="/" className="text-sm text-[#2D7A4F] hover:underline">
              ← Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
