import type { Metadata } from "next";
import Link from "next/link";
import { ORGNR_VISNING } from "@/lib/kontakt";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description:
    "Så behandlar ReLoka AB dina personuppgifter — vad vi samlar in, varför, hur länge, och vilka rättigheter du har.",
};

const H2_CLS = "text-xl font-semibold text-[#1a1a1a] mt-10 mb-3";
const P_CLS = "text-sm text-gray-600 leading-relaxed mb-3";
const UL_CLS = "list-disc pl-5 space-y-1.5 text-sm text-gray-600 leading-relaxed mb-3";

export default function Integritetspolicy() {
  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <section className="bg-white border-b border-gray-100 py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2D7A4F]">
            Juridiskt
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-3 mb-3">
            Integritetspolicy
          </h1>
          <p className="text-gray-500 text-sm">Senast uppdaterad: 7 juli 2026</p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          <p className={P_CLS}>
            ReLoka AB (org.nr {ORGNR_VISNING}), med säte i Linköping, är
            personuppgiftsansvarig för behandlingen av personuppgifter på reloka.se.
            Den här policyn beskriver vilka uppgifter vi samlar in, varför, hur länge
            vi sparar dem och vilka rättigheter du har enligt dataskyddsförordningen
            (GDPR).
          </p>

          <h2 className={H2_CLS}>Vilka uppgifter vi samlar in</h2>
          <ul className={UL_CLS}>
            <li>
              <strong>Boknings- och offertförfrågningar:</strong> namn på kontaktperson,
              e-postadress, telefonnummer, företagsnamn, organisationsnummer samt i
              förekommande fall namn på den som ska bo i bostaden och det du själv
              skriver i meddelandefältet.
            </li>
            <li>
              <strong>Hyresvärdsanmälningar:</strong> namn, e-postadress, telefonnummer,
              stad och adress för bostaden samt ditt meddelande.
            </li>
            <li>
              <strong>Användarkonto:</strong> namn, e-postadress och lösenord
              (lösenord lagras alltid krypterat/hashat — vi kan aldrig se det).
            </li>
            <li>
              <strong>Teknisk information:</strong> anonym, cookielös besöksstatistik
              (sidvisningar och prestanda) via vår driftleverantör.
            </li>
          </ul>

          <h2 className={H2_CLS}>Varför vi behandlar uppgifterna</h2>
          <ul className={UL_CLS}>
            <li>
              För att hantera och besvara din förfrågan samt förbereda och fullgöra
              avtal om boende (rättslig grund: åtgärder på din begäran innan avtal,
              samt fullgörande av avtal).
            </li>
            <li>
              För att kontakta dig som hyresvärd om din anmälda bostad (rättslig
              grund: åtgärder på din begäran innan avtal).
            </li>
            <li>
              För att tillhandahålla ditt användarkonto (rättslig grund: fullgörande
              av avtal).
            </li>
            <li>
              För att skicka bekräftelsemejl på förfrågningar du själv skickat
              (rättslig grund: berättigat intresse).
            </li>
          </ul>
          <p className={P_CLS}>
            Vi säljer aldrig dina uppgifter och skickar ingen marknadsföring du inte
            bett om.
          </p>

          <h2 className={H2_CLS}>Hur länge vi sparar uppgifterna</h2>
          <ul className={UL_CLS}>
            <li>
              Förfrågningar som inte leder till avtal raderas senast 12 månader efter
              att de kom in.
            </li>
            <li>
              Uppgifter kopplade till ingångna avtal sparas så länge avtalet gäller
              och därefter så länge bokförings- och skattelagstiftning kräver
              (normalt 7 år).
            </li>
            <li>Användarkonton sparas tills du begär att kontot raderas.</li>
          </ul>

          <h2 className={H2_CLS}>Vilka som får del av uppgifterna</h2>
          <p className={P_CLS}>
            Uppgifterna behandlas av oss och av våra leverantörer
            (personuppgiftsbiträden) som behövs för att driva tjänsten: Vercel
            (drift och cookielös statistik), Neon (databas) och Resend
            (e-postutskick). Vi har biträdesavtal med leverantörerna. I den mån
            uppgifter överförs utanför EU/EES sker det med giltiga
            överföringsmekanismer, t.ex. EU-kommissionens standardavtalsklausuler.
          </p>

          <h2 className={H2_CLS}>Cookies</h2>
          <p className={P_CLS}>
            Vi använder en (1) cookie: en nödvändig inloggningscookie som skapas
            när du loggar in och som krävs för att ditt konto ska fungera. Vi
            använder inga marknadsförings- eller spårningscookies — vår
            besöksstatistik är helt cookielös. Därför visar vi ingen cookiebanner.
          </p>

          <h2 className={H2_CLS}>Dina rättigheter</h2>
          <ul className={UL_CLS}>
            <li>Få besked om och kopia av de uppgifter vi har om dig (registerutdrag).</li>
            <li>Få felaktiga uppgifter rättade.</li>
            <li>Få dina uppgifter raderade, när de inte längre måste sparas enligt lag.</li>
            <li>Invända mot behandling som stödjer sig på berättigat intresse.</li>
            <li>Få ut dina uppgifter i maskinläsbart format (dataportabilitet).</li>
          </ul>
          <p className={P_CLS}>
            Kontakta oss på{" "}
            <a href="mailto:info@reloka.se" className="text-[#2D7A4F] hover:underline">
              info@reloka.se
            </a>{" "}
            så hjälper vi dig. Du har också rätt att lämna klagomål till
            Integritetsskyddsmyndigheten (
            <a
              href="https://www.imy.se"
              className="text-[#2D7A4F] hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              imy.se
            </a>
            ).
          </p>

          <h2 className={H2_CLS}>Ändringar i policyn</h2>
          <p className={P_CLS}>
            Om vi ändrar policyn publicerar vi den nya versionen här med nytt
            datum. Vid väsentliga ändringar informerar vi dig som har konto.
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
