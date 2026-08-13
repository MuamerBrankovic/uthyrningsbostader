import * as Sentry from "@sentry/nextjs";
import { SENTRY_AKTIVT } from "@/lib/sentry-installningar";

// ═══════════════════════════════════════════════════════════════════════════
// RAPPORTERA FEL TILL SENTRY
//
// VAD FILEN GÖR
// Ger ett enda sätt att skicka ett fel till Sentry från vanlig kod. Används
// där vi FÅNGAR ett fel med try/catch — sådana fel ser Next.js aldrig, så de
// måste rapporteras för hand. Fel som får bubbla upp fångas automatiskt av
// instrumentation.ts.
//
// LÖFTET: den här funktionen kastar aldrig och returnerar aldrig ett fel.
// Går Sentry ned eller är felkonfigurerat fortsätter appen precis som förut.
// Därför är hela kroppen inlindad i try/catch.
//
// VIKTIGT OM PERSONUPPGIFTER
// Skicka aldrig e-postadress, telefonnummer eller kontrakts-URL i `kontext`.
// Använd id:n och namn på bostad/rum i stället — det räcker för att förstå
// vad som gick fel. (lib/sentry-installningar.ts maskerar dessutom kända
// känsliga fältnamn som sista skyddsnät, men lita inte på det.)
// ═══════════════════════════════════════════════════════════════════════════

type Kontext = Record<string, string | number | boolean | null | undefined>;

export function rapporteraFel(
  fel: unknown,
  vad: string,
  kontext: Kontext = {}
): void {
  try {
    if (!SENTRY_AKTIVT) return;

    Sentry.withScope((scope) => {
      // "vad" grupperar felen i Sentry, t.ex. "email.bokningsmail".
      scope.setTag("handelse", vad);
      scope.setContext("reloka", { ...kontext });
      scope.setLevel("error");

      if (fel instanceof Error) {
        Sentry.captureException(fel);
      } else {
        // Något som inte är ett Error-objekt (t.ex. en sträng från Resend).
        Sentry.captureException(new Error(`${vad}: ${String(fel)}`));
      }
    });
  } catch {
    // Med flit tyst: felrapportering får aldrig bli ett nytt fel.
  }
}
