// ─── ReLoka API-testsvit ──────────────────────────────────────────────────────
//
// Bevisar de kritiska säkerhets- och affärsreglerna mot en LOKAL dev-server.
//
// Körs automatiskt i CI på varje pull request, mot en egen Postgres som är
// helt skild från produktionen. Det är det vanliga sättet att köra den.
//
// KÖRNING LOKALT — kräver en lokal testdatabas, ALDRIG produktionens:
//   1. Starta en lokal Postgres (samma som i CI), t.ex. med Docker:
//        docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=reloka_test postgres:17
//   2. I PowerShell, i projektmappen:
//        $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/reloka_test"
//        npx prisma migrate deploy
//        npm run dev
//   3. I ett annat fönster, med samma $env:DATABASE_URL:  npm run test:api
//
// Sviten vägrar köra om DATABASE_URL pekar någon annanstans än på den egna
// datorn. .env innehåller produktionens adress, och tidigare körningar mot
// den lade testbostäder synligt på reloka.se medan sviten pågick.
//
// Sviten är självstädande: den skapar egen testdata (bostad "[TEST] ...",
// användare på @test.reloka.internal, en engångs-admin med slumpat lösenord)
// och raderar allt efteråt — även kvarlämnat skräp från en kraschad körning.
// Dev-servern måste använda samma databas: annars misslyckas inloggningen av
// engångs-admin och inget test körs.
// ─────────────────────────────────────────────────────────────────────────────

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });

// Spärr: sviten skapar och raderar data och får bara köras mot en databas på
// den egna datorn (som i CI) — aldrig mot produktionen på Neon.
const DB_VARD = (() => {
  try {
    return new URL(process.env.DATABASE_URL).hostname;
  } catch {
    return "(saknas eller ogiltig)";
  }
})();
if (!["localhost", "127.0.0.1", "[::1]"].includes(DB_VARD)) {
  throw new Error(
    `DATABASE_URL pekar på ${DB_VARD}. Testsviten körs bara mot en lokal ` +
      "testdatabas (localhost) — se KÖRNING överst i tests/api.test.js."
  );
}

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const BAS = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const TESTDOMAN = "test.reloka.internal";
const KOR = Date.now().toString(36); // unik markör för denna körning

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Slumpad "klient-IP" per körning så den IP-baserade rate-limitern
// inte ger falska 429 vid upprepade körningar
const FAKE_IP = `10.${slump(255)}.${slump(255)}.${slump(255)}`;
function slump(max) {
  return Math.floor(Math.random() * max);
}

function api(path, opts = {}) {
  return fetch(`${BAS}${path}`, {
    ...opts,
    headers: {
      "x-forwarded-for": FAKE_IP,
      ...(typeof opts.body === "string" ? { "content-type": "application/json" } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

function cookieFran(res) {
  const cookies = res.headers.getSetCookie?.() ?? [];
  const auth = cookies.find((c) => c.startsWith("auth-token="));
  return auth ? auth.split(";")[0] : null;
}

function datum(dagarFramat) {
  const d = new Date();
  d.setDate(d.getDate() + dagarFramat);
  return d;
}

// Delad testdata (skapas i before)
let bostadId, rum1Id, rum2Id, rum3Id;
let adminCookie;
let anvA, anvB, cookieA, cookieB;

async function stadaTestdata() {
  // Bostad-radering kaskaderar rum → bokningar
  await prisma.bostad.deleteMany({ where: { namn: { startsWith: "[TEST]" } } });
  await prisma.anvandare.deleteMany({ where: { email: { endsWith: `@${TESTDOMAN}` } } });
}

before(async () => {
  // Servern måste vara igång
  try {
    const ping = await fetch(`${BAS}/api/auth/session`);
    if (!ping.ok && ping.status !== 401) throw new Error(`status ${ping.status}`);
  } catch {
    throw new Error(
      `Ingen dev-server på ${BAS}. Starta den först i ett annat fönster: npm run dev`
    );
  }

  await stadaTestdata(); // rensa ev. skräp från kraschad tidigare körning

  const bostad = await prisma.bostad.create({
    data: {
      namn: `[TEST] Testbostaden ${KOR}`,
      stadsdel: "Teststaden",
      bostadstyp: "privat_rum",
      rum: {
        create: [
          { namn: "Testrum 1", manadshyra: 9000 },
          { namn: "Testrum 2", manadshyra: 9500 },
          { namn: "Testrum 3", manadshyra: 10000 },
        ],
      },
    },
    include: { rum: { orderBy: { namn: "asc" } } },
  });
  bostadId = bostad.id;
  [rum1Id, rum2Id, rum3Id] = bostad.rum.map((r) => r.id);

  // Engångs-admin: slumpat lösenord, skapas direkt i DB, raderas i after().
  // Inga riktiga inloggningsuppgifter behövs eller hårdkodas.
  const adminLosen = `Test-${crypto.randomUUID()}`;
  await prisma.anvandare.create({
    data: {
      namn: "[TEST] Admin",
      email: `admin-${KOR}@${TESTDOMAN}`,
      losenord: await bcrypt.hash(adminLosen, 10),
      roll: "admin",
    },
  });
  const loginRes = await api("/api/auth/logga-in", {
    method: "POST",
    body: JSON.stringify({ email: `admin-${KOR}@${TESTDOMAN}`, losenord: adminLosen }),
  });
  assert.equal(loginRes.status, 200, "Kunde inte logga in engångs-admin");
  adminCookie = cookieFran(loginRes);
  assert.ok(adminCookie, "Ingen auth-cookie från admin-inloggning");
});

after(async () => {
  await stadaTestdata();
  await prisma.$disconnect();
});

// ─── 1. Roll-injection ────────────────────────────────────────────────────────

test("roll-injection: registrera med roll admin ger vanlig användare", async () => {
  const email = `inj-${KOR}@${TESTDOMAN}`;
  const res = await api("/api/auth/registrera", {
    method: "POST",
    body: JSON.stringify({
      namn: "Injektionstest",
      email,
      losenord: `Test-${crypto.randomUUID()}`,
      roll: "admin", // ← försöket
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.roll, "hyresgast", "API-svaret ska visa hyresgast");

  const iDb = await prisma.anvandare.findUnique({ where: { email } });
  assert.equal(iDb?.roll, "hyresgast", "Databasen ska visa hyresgast");
});

// ─── 2. Ingen PII i publika svar ─────────────────────────────────────────────

test("publika svar: ingen kund-PII och ingen kontrakt_url", async () => {
  // Bekräftad bokning med PII + kontrakt-URL — inget av detta får synas publikt
  await prisma.bokning.create({
    data: {
      rum_id: rum1Id,
      kund_kontaktperson: "Hemlig Persson",
      kund_foretag: "Hemliga Firman AB",
      email: `hemlig-kund@${TESTDOMAN}`,
      telefon: "+46700000001",
      startdatum: datum(0),
      slutdatum: null,
      status: "bekraftad",
      kontrakt_url: "https://blob.example.com/hemligt-kontrakt.pdf",
      kontrakt_status: "uppladdat",
    },
  });

  const TILLATNA_FALT = ["id", "startdatum", "slutdatum", "status"];
  const svar = await Promise.all([
    api("/api/bostader").then((r) => r.json()),
    api(`/api/bostader/${bostadId}`).then((r) => r.json()),
    api(`/api/rum/${rum1Id}`).then((r) => r.json()),
  ]);

  for (const data of svar) {
    const text = JSON.stringify(data);
    assert.ok(!text.includes("Hemlig Persson"), "kundnamn läckte");
    assert.ok(!text.includes("hemlig-kund@"), "kund-e-post läckte");
    assert.ok(!text.includes("+46700000001"), "kundtelefon läckte");
    assert.ok(!text.includes("hemligt-kontrakt"), "kontrakt_url läckte");
    assert.ok(!text.includes("kontrakt_url"), "kontrakt-fält läckte");
  }

  // Bokningsobjekten i rum-svaret ska vara exakt vitlistan
  const rumSvar = svar[2];
  assert.ok(Array.isArray(rumSvar.bokningar) && rumSvar.bokningar.length > 0);
  for (const b of rumSvar.bokningar) {
    assert.deepEqual(Object.keys(b).sort(), [...TILLATNA_FALT].sort());
  }
});

// ─── 3. Förfrågan blockerar inte rum ─────────────────────────────────────────

test("förfrågan blockerar inte rummet", async () => {
  const gorForfragan = () =>
    api("/api/bokningar", {
      method: "POST",
      body: JSON.stringify({
        rum_id: rum2Id,
        kund_kontaktperson: "Test Kund",
        email: `kund1-${KOR}@${TESTDOMAN}`,
        startdatum: new Date().toISOString().split("T")[0],
      }),
    });

  const forsta = await gorForfragan();
  assert.equal(forsta.status, 201, "första förfrågan ska gå igenom");

  // Rummet ska INTE visas som upptaget: publika svaret listar inga förfrågningar
  const rumSvar = await api(`/api/rum/${rum2Id}`).then((r) => r.json());
  assert.equal(rumSvar.bokningar.length, 0, "förfrågan ska inte synas/blockera publikt");

  // ... och en andra förfrågan på samma rum och datum ska också gå igenom
  const andra = await gorForfragan();
  assert.equal(andra.status, 201, "andra förfrågan ska inte nekas av den första");
});

// ─── 4. Dubbelbokningsskydd vid bekräftelse ──────────────────────────────────

test("dubbelbokningsskydd: överlappande bekräftelse nekas, icke-överlappande tillåts", async () => {
  const bekraftad = await prisma.bokning.create({
    data: {
      rum_id: rum3Id,
      kund_kontaktperson: "Kund Ett",
      email: `kund-ett@${TESTDOMAN}`,
      startdatum: datum(0),
      slutdatum: datum(30),
      status: "bekraftad",
    },
  });
  const overlappande = await prisma.bokning.create({
    data: {
      rum_id: rum3Id,
      kund_kontaktperson: "Kund Två",
      email: `kund-tva@${TESTDOMAN}`,
      startdatum: datum(10), // mitt i den bekräftade perioden
      status: "forfragan",
    },
  });
  const efterat = await prisma.bokning.create({
    data: {
      rum_id: rum3Id,
      kund_kontaktperson: "Kund Tre",
      email: `kund-tre@${TESTDOMAN}`,
      startdatum: datum(40), // efter den bekräftades slutdatum
      status: "forfragan",
    },
  });

  const nekad = await api(`/api/bokningar/${overlappande.id}`, {
    method: "PATCH",
    headers: { cookie: adminCookie },
    body: JSON.stringify({ status: "bekraftad" }),
  });
  assert.equal(nekad.status, 409, "överlappande bekräftelse ska ge 409");

  const tillaten = await api(`/api/bokningar/${efterat.id}`, {
    method: "PATCH",
    headers: { cookie: adminCookie },
    body: JSON.stringify({ status: "bekraftad" }),
  });
  assert.equal(tillaten.status, 200, "icke-överlappande bekräftelse ska tillåtas");
  assert.equal((await tillaten.json()).status, "bekraftad");
});

// ─── 5. Skräpdata ger 400, inte 500 ──────────────────────────────────────────

test("skräpdata ger 400 med tydligt fel, aldrig 500", async () => {
  const fall = [
    {
      namn: "trasig JSON till bokningar",
      gor: () => api("/api/bokningar", { method: "POST", body: "detta är inte json{{" }),
    },
    {
      namn: "offert med ogiltig telefon",
      gor: () =>
        api("/api/offert", {
          method: "POST",
          body: JSON.stringify({
            foretag: "AB Test", kontaktperson: "T", email: `x@${TESTDOMAN}`,
            telefon: "abc", stad: "Linköping",
          }),
        }),
    },
    {
      namn: "offert med e-post som siffra",
      gor: () =>
        api("/api/offert", {
          method: "POST",
          body: JSON.stringify({
            foretag: "AB Test", kontaktperson: "T", email: 12345,
            telefon: "013-123 45 67", stad: "Linköping",
          }),
        }),
    },
    {
      namn: "hyresvärdsanmälan med namn som objekt",
      gor: () =>
        api("/api/hyresvardar", {
          method: "POST",
          body: JSON.stringify({ namn: { hack: true }, email: `x@${TESTDOMAN}` }),
        }),
    },
    {
      namn: "admin: rum med månadshyra 'abc'",
      gor: () =>
        api("/api/rum", {
          method: "POST",
          headers: { cookie: adminCookie },
          body: JSON.stringify({ bostad_id: bostadId, namn: "X", manadshyra: "abc" }),
        }),
    },
    {
      namn: "admin: rum med påhittad rumstyp",
      gor: () =>
        api("/api/rum", {
          method: "POST",
          headers: { cookie: adminCookie },
          body: JSON.stringify({ bostad_id: bostadId, namn: "X", manadshyra: 4900, bostadstyp: "slott" }),
        }),
    },
    {
      namn: "admin: bokning med påhittad status",
      gor: () =>
        api(`/api/bokningar/${crypto.randomUUID()}`, {
          method: "PATCH",
          headers: { cookie: adminCookie },
          body: JSON.stringify({ status: "hackad" }),
        }),
    },
  ];

  for (const f of fall) {
    const res = await f.gor();
    assert.equal(res.status, 400, `${f.namn}: förväntade 400, fick ${res.status}`);
    const body = await res.json();
    assert.ok(typeof body.error === "string" && body.error.length > 0, `${f.namn}: saknar feltext`);
  }
});

// ─── 6. Mina bokningar-isolering ─────────────────────────────────────────────

test("mina bokningar: användare ser bara sina egna, utan kontraktfält", async () => {
  async function skapaAnvandare(prefix) {
    const email = `${prefix}-${KOR}@${TESTDOMAN}`;
    const res = await api("/api/auth/registrera", {
      method: "POST",
      body: JSON.stringify({ namn: `[TEST] ${prefix}`, email, losenord: `Test-${crypto.randomUUID()}` }),
    });
    assert.equal(res.status, 201);
    const cookie = cookieFran(res);
    const anv = await prisma.anvandare.findUnique({ where: { email } });
    return { anv, cookie };
  }

  ({ anv: anvA, cookie: cookieA } = await skapaAnvandare("anv-a"));
  ({ anv: anvB, cookie: cookieB } = await skapaAnvandare("anv-b"));

  const bokningA = await prisma.bokning.create({
    data: {
      rum_id: rum2Id, anvandare_id: anvA.id, kund_kontaktperson: "Anv A",
      email: anvA.email, startdatum: datum(5), status: "forfragan",
    },
  });
  const bokningB = await prisma.bokning.create({
    data: {
      rum_id: rum2Id, anvandare_id: anvB.id, kund_kontaktperson: "Anv B",
      email: anvB.email, startdatum: datum(6), status: "forfragan",
    },
  });

  const svarA = await api("/api/bokningar", { headers: { cookie: cookieA } }).then((r) => r.json());
  const idnA = svarA.map((b) => b.id);
  assert.ok(idnA.includes(bokningA.id), "A ska se sin egen bokning");
  assert.ok(!idnA.includes(bokningB.id), "A ska INTE se B:s bokning");
  for (const b of svarA) {
    assert.ok(!("kontrakt_url" in b), "kontrakt_url ska inte finnas i Mina bokningar");
  }

  const svarB = await api("/api/bokningar", { headers: { cookie: cookieB } }).then((r) => r.json());
  assert.ok(!svarB.map((b) => b.id).includes(bokningA.id), "B ska INTE se A:s bokning");

  const utanInloggning = await api("/api/bokningar");
  assert.equal(utanInloggning.status, 401, "utloggad ska få 401");
});

// ─── 7. Admin-skydd ──────────────────────────────────────────────────────────

test("admin-endpoints nekar utan admin-session", async () => {
  const endpoints = [
    { namn: "POST /api/bostader", gor: (h) => api("/api/bostader", { method: "POST", headers: h, body: JSON.stringify({ namn: "[TEST] Intrång" }) }) },
    { namn: "POST /api/rum", gor: (h) => api("/api/rum", { method: "POST", headers: h, body: JSON.stringify({ bostad_id: bostadId, namn: "X", manadshyra: 1 }) }) },
    { namn: "POST /api/upload", gor: (h) => api("/api/upload", { method: "POST", headers: h }) },
    { namn: "POST /api/kontrakt", gor: (h) => api("/api/kontrakt", { method: "POST", headers: h }) },
    { namn: "GET /api/bokningar?alla=1", gor: (h) => api("/api/bokningar?alla=1", { headers: h }) },
    { namn: "PATCH /api/bokningar/[id]", gor: (h) => api(`/api/bokningar/${crypto.randomUUID()}`, { method: "PATCH", headers: h, body: JSON.stringify({ status: "bekraftad" }) }) },
  ];

  for (const e of endpoints) {
    const utan = await e.gor({});
    assert.equal(utan.status, 401, `${e.namn} utan inloggning: förväntade 401, fick ${utan.status}`);

    const somHyresgast = await e.gor({ cookie: cookieA });
    assert.equal(somHyresgast.status, 403, `${e.namn} som hyresgast: förväntade 403, fick ${somHyresgast.status}`);
  }
});

// ─── 8. Rumstyp och del av huset sparas per rum ──────────────────────────────

test("admin: rum sparar bostadstyp och sektion", async () => {
  const res = await api("/api/rum", {
    method: "POST",
    headers: { cookie: adminCookie },
    body: JSON.stringify({
      bostad_id: bostadId,
      namn: "Testrum med eget bad",
      manadshyra: 4900,
      bostadstyp: "rum_eget_bad",
      sektion: "Nedre våningen",
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.bostadstyp, "rum_eget_bad", "API-svaret ska visa bostadstyp");
  assert.equal(body.sektion, "Nedre våningen", "API-svaret ska visa sektion");

  const iDb = await prisma.rum.findUnique({ where: { id: body.id } });
  assert.equal(iDb?.bostadstyp, "rum_eget_bad", "bostadstyp ska sparas i databasen");
  assert.equal(iDb?.sektion, "Nedre våningen", "sektion ska sparas i databasen");

  // Utan fälten: standardtyp och ingen sektion
  const utan = await api("/api/rum", {
    method: "POST",
    headers: { cookie: adminCookie },
    body: JSON.stringify({ bostad_id: bostadId, namn: "Testrum utan typ", manadshyra: 4900 }),
  });
  assert.equal(utan.status, 201);
  const utanBody = await utan.json();
  assert.equal(utanBody.bostadstyp, "privat_rum");
  assert.equal(utanBody.sektion, null);
});

// ─── 9. Tomma fält från dashboarden (null) godtas ────────────────────────────

test("admin: dashboardens null för tomma fält ger 201, inte 400", async () => {
  // Formulären i dashboarden skickar null för tomma valfria fält
  // (t.ex. kvm: null). Det ska betyda "tomt", inte avvisas.
  // Samma body som "Lägg upp rum" skickar när bara de obligatoriska fälten är ifyllda.
  const rum = await api("/api/rum", {
    method: "POST",
    headers: { cookie: adminCookie },
    body: JSON.stringify({
      bostad_id: bostadId,
      namn: "Testrum med tomma fält",
      sektion: null,
      bostadstyp: "privat_rum",
      beskrivning: null,
      kvm: null,
      manadshyra: 4900,
      bilder: [],
      moblering: [],
    }),
  });
  const rumBody = await rum.json();
  assert.equal(rum.status, 201, `rum: förväntade 201, fick ${rum.status}: ${rumBody.error ?? ""}`);
  assert.equal(rumBody.kvm, null);
  assert.equal(rumBody.beskrivning, null);
  assert.equal(rumBody.sektion, null);
  assert.equal(rumBody.bostadstyp, "privat_rum");

  // Bostaden raderas direkt — testbostäder ska synas så kort tid som möjligt
  const bostad = await api("/api/bostader", {
    method: "POST",
    headers: { cookie: adminCookie },
    body: JSON.stringify({
      namn: `[TEST] Tomma fält ${KOR}`,
      adress: null,
      stadsdel: null,
      bostadstyp: "privat_rum",
      beskrivning: null,
      bilder: [],
      delade_utrymmen: [],
      inkluderat: [],
      kontaktperson_namn: null,
      kontaktperson_email: null,
      kontaktperson_telefon: null,
      kontaktperson_bild: null,
    }),
  });
  const bostadBody = await bostad.json();
  if (bostadBody.id) await prisma.bostad.delete({ where: { id: bostadBody.id } });
  assert.equal(bostad.status, 201, `bostad: förväntade 201, fick ${bostad.status}: ${bostadBody.error ?? ""}`);
});

// ─── 10. Rummen visas i skapandeordning ──────────────────────────────────────

test("rummen listas i skapandeordning på både lista och bostadssida", async () => {
  // Raderna sparas i omvänd ordning mot created_at, och namnen går i
  // bokstavsordning åt fel håll — så varken lagringsordningen, namnet eller
  // id:t kan råka ge rätt svar. Bara en sortering på created_at gör det.
  const t0 = Date.now() - 60_000;
  const ordning = await prisma.bostad.create({
    data: {
      namn: `[TEST] Ordning ${KOR}`,
      rum: {
        create: [
          { namn: "A tredje", manadshyra: 4900, created_at: new Date(t0 + 2000) },
          { namn: "B andra", manadshyra: 4900, created_at: new Date(t0 + 1000) },
          { namn: "C först", manadshyra: 4900, created_at: new Date(t0) },
        ],
      },
    },
  });
  const forvantat = ["C först", "B andra", "A tredje"];

  try {
    const lista = await api("/api/bostader").then((r) => r.json());
    const iListan = lista.find((b) => b.id === ordning.id);
    assert.ok(iListan, "testbostaden ska finnas i listan");
    assert.deepEqual(iListan.rum.map((r) => r.namn), forvantat, "/api/bostader");

    const detalj = await api(`/api/bostader/${ordning.id}`).then((r) => r.json());
    assert.deepEqual(detalj.rum.map((r) => r.namn), forvantat, "/api/bostader/[id]");
  } finally {
    // Raderas direkt — testbostäder ska synas så kort tid som möjligt
    await prisma.bostad.delete({ where: { id: ordning.id } });
  }
});

// ─── 11. Startsidans "från"-priser kommer ur databasen ───────────────────────

test("startsidan visar lägsta månadshyran per rumstyp ur databasen", async () => {
  // Facit räknas ur databasen, så testet gäller oavsett vilka rum som finns
  const rader = await prisma.rum.groupBy({ by: ["bostadstyp"], _min: { manadshyra: true } });
  const lagst = Object.fromEntries(rader.map((r) => [r.bostadstyp, r._min.manadshyra]));

  const html = (await api("/").then((r) => r.text())).replace(/ |&nbsp;/g, " ");
  const kort = {
    privat_rum: "Privat rum",
    rum_eget_bad: "Rum med eget bad",
    hel_lagenhet: "Hel lägenhet",
  };
  for (const [typ, titel] of Object.entries(kort)) {
    const forvantat = lagst[typ]
      ? `från ${lagst[typ].toLocaleString("sv-SE").replace(/ /g, " ")} kr/mån`
      : "Pris på förfrågan";
    const efterTitel = html.slice(html.indexOf(`>${titel}</h3>`));
    assert.ok(
      efterTitel.slice(0, 300).includes(forvantat),
      `${titel}: väntade "${forvantat}" på startsidan`
    );
  }
});
