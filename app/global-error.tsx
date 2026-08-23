"use client"; // Felgränser måste vara klientkomponenter

// Sista skyddsnätet: tar över när själva rot-layouten kraschar. Då finns
// varken Navbar eller layoutens <html>/<body>, så den här filen måste rita
// upp dem själv och importera de globala stilarna på egen hand.
import "./globals.css";
import { useEffect } from "react";
import { rapporteraFel } from "@/lib/sentry-rapportera";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Ett fel som tar sig ända hit har slagit ut rot-layouten. Felgränsen
    // hindrar det från att bubbla vidare till Sentrys automatiska fångst,
    // så utan det här anropet skulle den allvarligaste feltypen vi har bli
    // den enda vi aldrig fick veta om. Inga persondatafält skickas med.
    rapporteraFel(error, "ui.global-felgrans", { digest: error.digest ?? null });
  }, [error]);

  return (
    <html lang="sv">
      <body>
        {/* metadata-export fungerar inte i klientkomponenter — därför <title> */}
        <title>Något gick fel — ReLoka</title>
        <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md text-center">
            <p className="text-2xl font-bold tracking-tight text-[#1a1a1a] mb-8">
              Re<span className="text-[#2D7A4F]">Loka</span>
            </p>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
              Något gick fel
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Ett oväntat fel gjorde att sidan inte kunde visas. Försök igen —
              hjälper det inte är du välkommen att höra av dig till{" "}
              <a
                href="mailto:info@reloka.se"
                className="text-[#2D7A4F] hover:underline"
              >
                info@reloka.se
              </a>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => unstable_retry()}
                className="bg-[#2D7A4F] text-white text-sm px-7 py-3 rounded-full hover:bg-[#225f3d] transition-colors font-medium"
              >
                Försök igen
              </button>
              {/* Ingen next/link här: rot-layouten är trasig, så vi kan inte
                  lita på att routern är intakt. En full omladdning är mer
                  pålitlig än klientnavigering just i det här läget. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="bg-white border border-gray-200 text-[#2D7A4F] text-sm px-7 py-3 rounded-full hover:border-[#2D7A4F] transition-colors font-medium"
              >
                Till startsidan
              </a>
            </div>

            {error.digest && (
              <p className="text-xs text-gray-400 mt-8">
                Felkod: <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
