"use client"; // Felgränser måste vara klientkomponenter

import { useEffect } from "react";
import Link from "next/link";
import { rapporteraFel } from "@/lib/sentry-rapportera";

// Fångar oväntade fel i sidor och layouter under rot-layouten. Kraschar
// rot-layouten själv tar app/global-error.tsx över i stället.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  // Next 16 döpte om reset() till unstable_retry(). Skillnaden är att retry
  // hämtar om innehållet från servern, inte bara återställer felgränsen —
  // det är det man vill när felet berodde på ett misslyckat anrop.
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Utan det här anropet syns felet ingenstans: Next.js felgräns fångar
    // felet, så det bubblar aldrig vidare till Sentrys automatiska fångst.
    // Inga persondatafält skickas med — digest är en hash av felet, och
    // gör att ett serverfel går att para ihop med den händelse
    // onRequestError (instrumentation.ts) redan rapporterat för samma fel.
    rapporteraFel(error, "ui.felgrans", { digest: error.digest ?? null });
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
          Något gick fel
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Ett oväntat fel uppstod när sidan skulle visas. Försök igen — hjälper
          det inte är du välkommen att höra av dig till{" "}
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
          <Link
            href="/"
            className="bg-white border border-gray-200 text-[#2D7A4F] text-sm px-7 py-3 rounded-full hover:border-[#2D7A4F] transition-colors font-medium"
          >
            Till startsidan
          </Link>
        </div>

        {/* Digest är en hash av felet, inte feltexten — den kan visas för
            besökaren och gör att vi hittar rätt rad i serverloggen. */}
        {error.digest && (
          <p className="text-xs text-gray-400 mt-8">
            Felkod: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </main>
  );
}
