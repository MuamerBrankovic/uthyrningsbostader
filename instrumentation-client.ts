// Startar Sentry i WEBBLÄSAREN. Next.js kör filen efter att sidan laddats
// men innan React tar över, så även tidiga fel fångas.
// Filen måste ligga i projektets rot för att Next.js ska hitta den.
//
// Session Replay (videoinspelning av besökarens session) är medvetet INTE
// påslaget: vi lägger aldrig till replayIntegration. Det äter kvot och skulle
// dessutom spela in formulär med personuppgifter.
import * as Sentry from "@sentry/nextjs";
import {
  gemensammaInstallningar,
  TILLAGGS_URL_FILTER,
} from "@/lib/sentry-installningar";

Sentry.init({
  ...gemensammaInstallningar(),

  // Fel som kommer från filer i ett webbläsartillägg ignoreras direkt.
  // (beforeSend har ett andra, mer noggrant filter för samma sak.)
  denyUrls: TILLAGGS_URL_FILTER,
});

// Sentry kräver den här exporten för att veta när användaren navigerar mellan
// sidor. Hos oss lägger den bara till sidbyten i felens historik — den mäter
// ingen prestanda, eftersom tracesSampleRate är 0.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
