import type { ErrorEvent, Breadcrumb } from "@sentry/nextjs";

// ═══════════════════════════════════════════════════════════════════════════
// SENTRY-INSTÄLLNINGAR — delas av webbläsaren, servern och edge-runtimen
//
// VAD FILEN GÖR
// Här bestäms VAD som skickas till Sentry och vad som filtreras bort. De tre
// uppstartsfilerna (instrumentation-client.ts, sentry.server.config.ts och
// sentry.edge.config.ts) hämtar alla sina inställningar härifrån, så reglerna
// kan aldrig glida isär mellan dem.
//
// VILL DU FILTRERA BORT MER BRUS?  Lägg till en rad i BRUS-listan.
// VILL DU SKYDDA FLER FÄLT?        Lägg till ordet i KANSLIGA_NYCKLAR.
// ═══════════════════════════════════════════════════════════════════════════

// DSN:en talar om vilket Sentry-projekt felen ska till. Den läses ur
// miljövariabeln och står ALDRIG i koden. Saknas den är Sentry helt avstängt
// — appen fungerar precis som vanligt, inget kraschar.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Sentry är PÅ endast i produktion och endast om DSN finns.
// Under `npm run dev` skickas alltså ingenting — vi bränner ingen kvot på
// fel som vi ändå ser direkt i terminalen.
export const SENTRY_AKTIVT =
  Boolean(DSN) && process.env.NODE_ENV === "production";

// ─── Brusfilter ──────────────────────────────────────────────────────────────
// Fel vars meddelande matchar något här kastas INNAN de skickas iväg.
// Håll listan kort och skriv alltid varför — annars vet ingen om raden
// fortfarande behövs om ett år.
const BRUS: { monster: RegExp; varfor: string }[] = [
  {
    monster: /ResizeObserver loop/i,
    varfor: "Ofarlig webbläsarvarning, påverkar inte användaren",
  },
  {
    monster: /AbortError|aborted a request|operation was aborted|signal is aborted/i,
    varfor: "Fetch-anrop som avbryts när användaren navigerar vidare",
  },
  {
    monster: /Non-Error promise rejection captured/i,
    varfor: "Saknar stacktrace och går inte att felsöka",
  },
  {
    monster: /Failed to execute 'removeChild'|NotFoundError: The object can not be found here/i,
    varfor: "Orsakas av översättningstillägg (Google Translate) som flyttar DOM-noder",
  },
];

// Filer som körs från ett webbläsartillägg — inte vår kod, inte vårt problem.
const TILLAGGSPROTOKOLL = [
  "chrome-extension://",
  "moz-extension://",
  "safari-extension://",
  "safari-web-extension://",
  "webkit-masked-url:",
];

// Skickas till Sentrys inbyggda URL-filter i webbläsaren (denyUrls).
export const TILLAGGS_URL_FILTER = TILLAGGSPROTOKOLL.map(
  (p) => new RegExp(p.replace(/[/:]/g, "\\$&"))
);

function franWebblasartillagg(handelse: ErrorEvent): boolean {
  const ramar = (handelse.exception?.values ?? []).flatMap(
    (v) => v.stacktrace?.frames ?? []
  );
  return ramar.some(
    (r) =>
      typeof r.filename === "string" &&
      TILLAGGSPROTOKOLL.some((p) => r.filename!.startsWith(p))
  );
}

// ─── Maskering av personuppgifter ────────────────────────────────────────────
// Fältnamn som innehåller något av dessa ord får sitt värde ersatt.
// Matchningen är skiftlägesokänslig och räcker med att ordet ingår —
// "kund_email", "Authorization" och "auth-token" fastnar alla.
const KANSLIGA_NYCKLAR = [
  "losenord",
  "lösenord",
  "password",
  "token",
  "authorization",
  "cookie",
  "jwt",
  "secret",
  "apikey",
  "api_key",
  "database_url",
  "dsn",
  "email",
  "epost",
  "e-post",
  "telefon",
  "phone",
  "kontrakt_url",
  "intern_notering",
  "orgnr",
];

const MASKERAT = "[maskerat]";

// E-postadresser och svenska telefonnummer kan också ligga mitt i ett
// felmeddelande (t.ex. ett databasfel om dubblett på e-post). Vi maskerar
// dem i fritext också.
// Både "namn@exempel.se" och URL-kodat "namn%40exempel.se" — det senare dyker
// upp när adressen legat i en querystring.
const EPOST_MONSTER = /[\w.+-]+(?:@|%40)[\w-]+\.[\w.-]+/gi;
// Inget lookbehind här med flit — det kraschar i äldre Safari och skulle
// då slå ut hela klientbundlen.
const TELEFON_MONSTER = /(^|[^\d+])((?:\+46|0)(?:[\s-]?\d){7,10})(?!\d)/g;

export function maskeraText(text: string): string {
  return text
    .replace(EPOST_MONSTER, "[e-post maskerad]")
    .replace(TELEFON_MONSTER, (_, fore) => `${fore}[telefon maskerat]`);
}

function arKansligNyckel(nyckel: string): boolean {
  const n = nyckel.toLowerCase();
  return KANSLIGA_NYCKLAR.some((k) => n.includes(k));
}

// Querystring kan innehålla e-post, id:n eller tokens — bort med den.
function utanQuerystring(url: string): string {
  const i = url.search(/[?#]/);
  return i === -1 ? url : url.slice(0, i);
}

// Fält vars värde är en adress. Sentry och Next.js lägger in flera sådana på
// egen hand (t.ex. contexts.nextjs.request_path), och de tar med querystringen.
const URL_NYCKLAR = ["url", "path", "href", "target", "location"];

function arUrlNyckel(nyckel: string): boolean {
  const n = nyckel.toLowerCase();
  return URL_NYCKLAR.some((k) => n === k || n.includes(k));
}

// Går igenom ett objekt och maskerar känsliga värden. Djupet begränsas så att
// en cirkulär eller jättestor struktur aldrig kan hänga sig.
function maskera(varde: unknown, djup = 0, nyckel = ""): unknown {
  if (djup > 5) return "[för djupt]";
  if (typeof varde === "string") {
    // Adressfält får aldrig behålla sin querystring.
    const text = arUrlNyckel(nyckel) ? utanQuerystring(varde) : varde;
    return maskeraText(text);
  }
  if (Array.isArray(varde)) return varde.map((v) => maskera(v, djup + 1, nyckel));
  if (varde && typeof varde === "object") {
    const ut: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(varde as Record<string, unknown>)) {
      ut[k] = arKansligNyckel(k) ? MASKERAT : maskera(v, djup + 1, k);
    }
    return ut;
  }
  return varde;
}

// ─── Städning av varje händelse innan den lämnar servern/webbläsaren ─────────
export function stadaHandelse(handelse: ErrorEvent): ErrorEvent {
  // 1. Hela request-delen rensas: cookies (inkl. auth-token), headers
  //    (inkl. Authorization) och body skickas aldrig.
  if (handelse.request) {
    delete handelse.request.cookies;
    delete handelse.request.headers;
    delete handelse.request.data;
    delete handelse.request.query_string;
    if (typeof handelse.request.url === "string") {
      handelse.request.url = utanQuerystring(handelse.request.url);
    }
  }

  // 2. Ingen användaridentitet — varken id, e-post eller IP-adress.
  delete handelse.user;

  // 3. Serverns värdnamn säger oss ingenting men kan avslöja maskinnamn.
  delete handelse.server_name;

  // 4. Maskera känsliga fält i allt vi själva bifogar OCH i det Sentry/Next.js
  //    lägger till på egen hand (contexts.nextjs.request_path innehåller t.ex.
  //    hela adressen med querystring).
  if (handelse.extra) {
    handelse.extra = maskera(handelse.extra) as typeof handelse.extra;
  }
  if (handelse.contexts) {
    handelse.contexts = maskera(handelse.contexts) as typeof handelse.contexts;
  }
  if (handelse.tags) {
    handelse.tags = maskera(handelse.tags) as typeof handelse.tags;
  }

  // 5. Själva felmeddelandet kan innehålla persondata (databasfel om dubblett
  //    på e-post är det typiska fallet).
  if (handelse.message) handelse.message = maskeraText(handelse.message);
  for (const v of handelse.exception?.values ?? []) {
    if (v.value) v.value = maskeraText(v.value);
  }

  return handelse;
}

// ─── beforeSend: sista anhalten innan något skickas ──────────────────────────
export function beforeSend(handelse: ErrorEvent): ErrorEvent | null {
  if (franWebblasartillagg(handelse)) return null;

  const text = [
    handelse.message,
    ...(handelse.exception?.values ?? []).map((v) => `${v.type}: ${v.value}`),
  ]
    .filter(Boolean)
    .join(" ");

  if (BRUS.some(({ monster }) => monster.test(text))) return null;

  return stadaHandelse(handelse);
}

// ─── beforeBreadcrumb: spåret av vad som hände före felet ─────────────────────
// Breadcrumbs plockar bl.a. upp console-loggar, och vår kod loggar t.ex.
// "to=kund@exempel.se" vid mejlutskick. Därför maskeras de här också.
export function beforeBreadcrumb(smula: Breadcrumb): Breadcrumb | null {
  if (smula.message) smula.message = maskeraText(smula.message);
  if (smula.data) {
    if (typeof smula.data.url === "string") {
      smula.data.url = utanQuerystring(smula.data.url);
    }
    smula.data = maskera(smula.data) as typeof smula.data;
  }
  return smula;
}

// ─── Inställningar som alla tre runtimes delar ───────────────────────────────
export function gemensammaInstallningar() {
  return {
    dsn: DSN,
    enabled: SENTRY_AKTIVT,

    // Skiljer på Production och Preview i Sentrys gränssnitt.
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",

    // MÅSTE vara false. true skulle få Sentry att automatiskt bifoga
    // IP-adress, cookies, headers och inloggad användare.
    sendDefaultPii: false,

    // Ingen prestandaövervakning — se motiveringen i rapporten. 0 = av.
    tracesSampleRate: 0,

    // Färre breadcrumbs = mindre risk att något oväntat följer med.
    maxBreadcrumbs: 20,

    beforeSend,
    beforeBreadcrumb,
  };
}
