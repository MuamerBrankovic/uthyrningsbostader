// Enkel in-memory rate-limiter för öppna endpoints.
//
// Begränsning: minnet delas inte mellan serverless-instanser på Vercel, så
// gränsen gäller per varm instans — tillräckligt mot naiva loopar och botar,
// men inte mot en distribuerad attack. Vid behov: byt implementationen här
// mot @upstash/ratelimit + Redis utan att ändra anropande kod.

type Bucket = { antal: number; aterstallsVid: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function rensaUtgangna(nu: number): void {
  for (const [key, bucket] of buckets) {
    if (nu > bucket.aterstallsVid) buckets.delete(key);
  }
}

/**
 * Returnerar ett 429-svar om gränsen är nådd, annars null.
 * Nyckeln är endpoint-namn + klientens IP.
 */
export function rateLimit(
  request: Request,
  nyckel: string,
  granser: { max: number; fonsterMs: number }
): Response | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "okand";
  const key = `${nyckel}:${ip}`;
  const nu = Date.now();

  if (buckets.size > MAX_BUCKETS) rensaUtgangna(nu);

  const bucket = buckets.get(key);
  if (!bucket || nu > bucket.aterstallsVid) {
    buckets.set(key, { antal: 1, aterstallsVid: nu + granser.fonsterMs });
    return null;
  }

  bucket.antal++;
  if (bucket.antal > granser.max) {
    return Response.json(
      { error: "För många försök. Vänta en stund och försök igen." },
      { status: 429 }
    );
  }
  return null;
}
