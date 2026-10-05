# UthyrningsBostäder — Projektstatus

## Senast uppdaterad
2026-10-05

## Tech Stack
- Next.js 16 (App Router) — frontend och API-rutter
- Prisma 7 mot Neon Postgres — databas
- Egen JWT-auth (jose + bcryptjs) i HTTP-only cookie
- Tailwind CSS — styling
- Resend — mejl · Vercel Blob — filer · Sentry — felövervakning
- Live på https://reloka.se (Vercel), lokalt på http://localhost:3000

## Färdiga sidor
- / — Startsida (app/page.tsx)
- /bostader — Bostadslista med filter (app/bostader/page.tsx)
- /bostad/[id] — Detaljsida (app/bostad/[id]/page.tsx)
- /rum/[id] — Rumssida med bokning (app/rum/[id]/)
- /offert — Offertformulär · /hyresvardar — Registrera bostad
- /om-oss · /faq · /integritetspolicy · /villkor
- /logga-in · /registrera — egen auth (app/logga-in/, app/registrera/)
- /dashboard — Dashboard, admin-flikar visas bara för rollen "admin"

## Databas
Schemat är sanningen: se `prisma/schema.prisma`. Modeller: Bostad, Rum,
Bokning, Anvandare, Offertforfragan, Hyresvardsanmalan. Migrationer ligger i
`prisma/migrations/` och läggs på med `npx prisma migrate deploy`.

Auth är egen sedan Dag 3 — inloggning sker mot tabellen `Anvandare`
(bcrypt-hashat lösenord) och sessionen är en JWT i en HTTP-only cookie.
Se `lib/auth.ts`.

## Starta projektet
1. Öppna VS Code
2. Öppna terminal (Ctrl + ö)
3. Skriv: npm run dev
4. Gå till: http://localhost:3000

> Historiken nedan är en daterad dagbok. Den beskriver vad som gjordes när,
> inte hur systemet ser ut idag — äldre poster skrivs därför aldrig om.


## Dag 2

✔ Deploy till Vercel
Projektet är nu deployat live på Vercel

GitHub‑repo är kopplat → automatisk deploy vid push
✔ Databasstatus
Tabell bostader är färdig och RLS‑säkrad

Tabell bokningar har policies men behöver testas nästa gång

✔ Övrigt
Projektet är nu i ett stabilt läge

Allt är organiserat och redo för vidare utveckling




## Dag 3

### Migrerade från Supabase till Neon + Prisma
- Supabase-projektet pausades efter 7 dagars inaktivitet (gratisplanen)
- Bytte till Neon PostgreSQL — pausas inte, bättre gratisplan
- Installerade Prisma 7 med PrismaPg-adapter (driver adapter krav i v7)
- Skrev om databasen från grunden enligt Home for Us-specen

### Ny databasstruktur (Prisma)
- Bostad — namn, adress, stadsdel, beskrivning, delade_utrymmen, inkluderat, narmaste_hallplats
- Rum — bostad_id, namn, beskrivning, kvm, manadshyra, moblering, status
- Bokning — rum_id, kund_foretag, kund_orgnr, kund_kontaktperson, boende_namn, email, telefon, startdatum, slutdatum (kan vara null), status
- Anvandare — email, losenord (bcrypt-hashat), namn, roll

### Egen auth (ersatte Supabase auth)
- JWT-sessioner via jose i HTTP-only cookie (auth-token, 30 dagars livstid)
- bcryptjs för lösenordshashning

### Nya API-routes (app/api/)
- GET/POST /api/bostader, GET /api/bostader/[id]
- GET /api/rum/[id], POST /api/rum
- GET/POST /api/bokningar (server-validering av startdatum)
- POST /api/auth/registrera, /api/auth/logga-in, /api/auth/logga-ut
- GET /api/auth/session

### Implementerat enligt Home for Us-specen
- Rum som egna enheter med egen sida /rum/[id]
- Status-badges grön/gul/grå (Ledigt nu / Ledigt från / Bokat till)
- Hover-popup på dator + tap-popup på mobil med statusinformation
- Faktarad på bostadssidan (antal rum, lediga, närmsta lediga datum, hållplats)
- Bokningsregler: endast startdatum, server-validerat, ingen intervallbokning
- Svenskt datumformat överallt (lib/datum.ts) — ISO internt
- SEO: generateMetadata + schema.org JSON-LD på rumsidor
- Dashboard utbyggd med 3 flikar (Mina bokningar, Lägg upp bostad, Lägg upp rum)

### Status
- Allt manuellt testat och fungerar
- Databasen körs på Neon (gratis, pausas inte)
- Klart för nästa steg

## Dag 4

### Browser agent tools aktiverat i VS Code
- Agenten kan nu själv öppna sidor, klicka, ladda upp filer och ta skärmdumpar
- Sparar tid — agenten testar och fixar buggar i samma sväng

### Bilduppladdning implementerad
- Installerat @vercel/blob för molnlagring
- Lokal fallback till /public/uploads/ när BLOB_READ_WRITE_TOKEN saknas
- Ny API-route: POST /api/upload (kräver inloggning, validerar bildtyper, max 5MB)
- Bilduppladdning i dashboard för både bostäder och rum
- Miniatyrer med möjlighet att ta bort enskilda bilder
- Progress-indikator under uppladdning

### Buggar agenten själv hittade & fixade
- React anti-pattern i bilduppladdaren (setState inuti setState)
- bilder-fältet ignorerades i POST /api/bostader

### Visning av riktiga bilder
- /bostader, /bostad/[id] och /rum/[id] visar nu uppladdade bilder
- Fallback till emoji-platshållare om inga bilder finns

### Publicering live på Vercel
- Projektet pushat till GitHub (MuamerBrankovic/uthyrningsbostader)
- Vercel kopplat till repo — automatisk deploy vid push
- Miljövariabler konfigurerade i Vercel: DATABASE_URL, JWT_SECRET, BLOB_READ_WRITE_TOKEN
- Vercel Blob-databas skapad i Stockholm-regionen (public access)
- Live på Vercel (numera https://reloka.se)

### Databas-städning
- Rensade testdata från E2E-tester (8 dummy-bostäder + tillhörande rum och bokningar)
- Lösenord återställt för ako.brankovic@outlook.com via bcrypt-hash i Neon
- HTML lang-attribut ändrat från "en" till "sv"

### Sprint 1 — B2B-omskrivning ("Home for Us")
- Affärsplan + två konkurrenter (homerental.se, rentahome.se) analyserade
- Hela sajten ompositionerad mot HR-chefer på bemanningsföretag
- Fokus initialt: Linköping och Norrköping

### Nya sidor
- /om-oss — grundarpresentation (Mahir + Ako), historia, värderingar
- /hyresvardar — pitch + kontaktformulär för fastighetsägare
- /faq — accordion med 13 Q&As (för företag, konsulter, hyresvärdar)
- Ny komponent: OffertModal (öppnas från alla "Få offert"-knappar)

### Uppdaterade sidor
- Startsidan — 8 sektioner: hero, problem/lösning, tre bostadstyper, processen, tjänstepaket, lokal närvaro, hyresvärdar-CTA, kontakt-CTA
- Navbar — nya menyval, "Få offert"-CTA, Linköping & Norrköping i logon
- /bostader — stad-filter (Linköping/Norrköping) + bostadstyp-filter

### Databas — nya fält och modeller
- Bostad: nytt fält bostadstyp (privat_rum | rum_eget_bad | hel_lagenhet)
- Ny modell Hyresvardsanmalan (för formuläret på /hyresvardar)
- Ny API-route: POST /api/hyresvardar

### SEO
- generateMetadata på alla nya sidor
- Open Graph + Twitter Card-metadata i layout
- Title: "Home for Us — Företagsbostäder i Linköping och Norrköping"

### Verifierat live på Vercel
- Mobilanpassning testad
- Bilduppladdning fungerar via Vercel Blob
- Alla nya sidor renderar korrekt

### Status efter Dag 4
- MVP klart och live
- Affärsmässigt: redo för Fas 2 (Pilot) enligt affärsplan
- Tekniskt redo att ta första riktiga kunden



## Dag 5

### Prio 1 — Bostäder och rum-upplevelsen
- Bostadssidan fick stor huvudbild (hero) med mörk overlay + namn/adress
- Faktarad uppdaterad med lucide-react ikoner (BedDouble, Users, CalendarDays, MapPin)
- Nya rumskort: 208px bild, status-cirkel 28px (grön/gul/röd), hover-overlay från botten
- Hover-overlay: statusinformation + CTA-knapp för alla tre statusar
- Mobil bottom sheet: tap på (i)-ikon öppnar sheet, tap inuti stänger INTE, tap utanför stänger
- Bildgalleri startar på bild 2 (hero visar bild 1 — ingen repetition)
- BildPlatshallare-komponent: grön gradient när bilder saknas
- Konsekvent typografi och spacing överallt
- Rumssidan: röd badge + röd cirkel för "bokat" (konsekvent färg)
- Bostadslistan: hover-lift + skugga, accent-grön bakgrund under bildladdning

### Buggar fixade
- Bottom sheet stängde sig direkt vid tap inuti (sheetRef fix)
- Desktop-overlay saknade CTA för "bokat tills vidare" (fallback "Visa rum")
- Hamburger-menyn fungerade inte på mobil (tap-target för litet, 38px → 46px)
- next.config.ts: allowedDevOrigins för lokal mobiltest

### Verifierat
- Alla fixar testade live på mobil
- Hamburger-menyn fungerar
- Bottom sheet fungerar korrekt (öppnar, stänger rätt)
- Pushat till Vercel — live (numera https://reloka.se)

### Nästa steg (Prio 2)
- Bekräftelsemail vid bokning (Resend)
- Offertformulär (/offert)
- Admin-roll (bara du och Mahir kan lägga upp bostäder)

## Dag 6

### Företaget har fått namn: ReLoka AB
- Bolag registrerat (stiftelseurkund undertecknad 27 maj 2026)
- Styrelseledamot: Muamer Brankovic | Styrelsesuppleant: Mahir Brankovic
- Säte: Linköping | Aktiekapital: 25 000 kr
- Org.nr: under registrering hos Bolagsverket

### Namnbyte Home for Us → ReLoka (genomfört)
- 13 förekomster av "Home for Us" + 9 av "homeforus.se" utbytta i koden
- Navbar-logo: "Re" (mörk) + "Loka" (grön)
- Footer: "ReLoka AB", "© 2026 ReLoka AB", "Linköping, Sverige"
- E-post-platshållare: info@reloka.se (ej aktiv än)
- Org.nr visas som "under registrering"
- Privatadresser borttagna helt från publika sajten
- Om-oss uppdaterad: Muamer (digital/marknad) + Mahir (sälj/kund) med riktiga roller
- JSON-LD: Organization "ReLoka AB", brand "ReLoka"

### Prio 2 — Admin, bekräftelsemail, offertformulär

ADMIN-ROLL:
- Återanvänder roll-fältet i Anvandare (värde "admin")
- requireAdmin() i lib/auth.ts — slår upp roll i DB (litar inte blint på JWT)
- POST /api/bostader, /api/rum, /api/upload kräver nu admin (403 annars)
- Dashboard visar admin-flikar bara för admins; vanliga användare ser bara "Mina bokningar"
- ako.brankovic@outlook.com satt som admin via SQL i Neon

BEKRÄFTELSEMAIL (Resend):
- Installerat resend, ny hjälpare lib/email.ts
- Två mail vid bokning: bekräftelse till kund + notis till admin
- Två mail vid offertförfrågan: bekräftelse till kund + notis till admin
- Fail-safe: mailfel blockerar ALDRIG att bokning/offert sparas
- Env-variabler: RESEND_API_KEY, AVSANDAR_EMAIL (Resends testadress tillfälligt), ADMIN_EMAIL
- OBS: Resends testavsändare kan bara maila till egen verifierad adress tills domänen reloka.se verifierats

OFFERTFORMULÄR:
- Ny sida /offert med fullständigt formulär (företag, orgnr, kontaktperson, email, telefon, stad, antal personer, datum, bostadstyp, meddelande)
- Ny Prisma-modell Offertforfragan + POST/GET /api/offert
- OffertModal behåller tel/email men har nu primär CTA "Fyll i offertformulär"
- Sparas i DB + skickar mail

DASHBOARD (admin):
- Ny flik "Offertförfrågningar" — listar alla offertförfrågningar
- Ny flik "Hyresvärdsanmälningar" — listar anmälningar från /hyresvardar
- Flik-raden scrollar horisontellt på mobil

### Konton & miljö
- Resend-konto skapat med API-nyckel (production)
- Miljövariabler tillagda i både .env.local och Vercel (alla tre miljöer)

### Verifierat live på Vercel
- Offertformulär: skickas, sparas, mail går ut (kund + admin)
- Admin-dashboard: alla fem flikar fungerar
- Offertförfrågan syns i dashboard
- Admin-skydd: icke-admin (test3) ser bara "Mina bokningar"

### Nästa steg (Prio 3)
- Köpa domän reloka.se + verifiera i Resend (så mail kan gå till alla adresser)
- Byt AVSANDAR_EMAIL till no-reply@reloka.se efter domänverifiering
- Uppdatera riktigt org.nr när Bolagsverket registrerat
- Riktig telefon istället för platshållare
- Designfinputs: bildstorlekar/beskärning som såg "utdragna" ut tidigare
- "Byt lösenord"-funktion i appen (slippa manuell hash i Neon)
- Open Graph-bilder för delning på sociala medier
- Vercel Analytics + sitemap.xml
- Lägga upp första riktiga bostäder med bilder
- Sociala medier (LinkedIn viktigast för B2B, + Instagram/Facebook/TikTok)

## Dag 7

### Bildoptimering (sharp + WebP)
- Installerat sharp — körs server-side i /api/upload (runtime nodejs)
- Nya uppladdningar: resize max 1920px, konvertering till WebP quality 85
- EXIF-rotering så mobilbilder inte hamnar liggande
- Förstorar aldrig små bilder (withoutEnlargement)
- Verifierat: ny rumsbild ser betydligt skarpare ut än gamla

### Aspect-ratios + visuell finputs
- Bostadskort + rumskort: aspect-[4/3] (branschstandard, konsekvent)
- Galleri: aspect-[16/10]
- Hero: behåller fast höjd 250px/400px
- quality 85 på hero och galleri, sizes-attribut korrekt per kontext
- Kontaktperson-avatar: Next.js Image istället för img

### "Byt lösenord"-funktion
- Ny API-route /api/auth/byt-losenord (verifierar nuvarande lösenord först)
- Ny flik "Mitt konto" i dashboard (synlig för alla inloggade)
- Kontoöversikt: e-post + roll-badge + avatar med initialer
- Realtidsvalidering, success/fel-banners, logga ut-knapp
- Eget starkt lösenord satt (inte längre NyttLösenord123)

### Vercel Analytics + Speed Insights
- Installerat @vercel/analytics + @vercel/speed-insights
- Aktiverat i Vercel-dashboarden
- Besöksstatistik + prestanda börjar samlas

### SEO — sitemap + robots
- app/sitemap.ts: statiska sidor + dynamiska bostäder/rum från DB
- app/robots.ts: tillåter publika sidor, blockerar dashboard/api/inloggning
- BASE_URL som lätt-bytbar konstant (för när reloka.se kommer)

### Open Graph-bild
- app/opengraph-image.tsx: 1200x630 dynamisk delningsbild
- Design: ljus B2B-stil, "Re" mörk + "Loka" grön, tagline, geografi
- twitter-image återanvänder samma design
- Visas vid delning på LinkedIn/Facebook/Slack

### Verifierat
- Lösenordsbyte fungerar (testat live)
- /sitemap.xml visar alla sidor + bostäder/rum
- /robots.txt korrekt
- OG-bild renderar
- Pushat till Vercel — allt live

### Kvar i Prio 3 (görs av Muamer själv, externt)
- Köpa domän reloka.se
- Verifiera reloka.se i Resend → byt AVSANDAR_EMAIL till no-reply@reloka.se
- Byt BASE_URL-konstanten i sitemap.ts + robots.ts när domänen finns
- Sociala medier-konton (LinkedIn viktigast för B2B)

### Väntar på externt
- Riktigt org.nr (Bolagsverket)
- Riktig telefon (platshållare i lib/kontakt.ts)
- Riktiga bostäder med bilder (när bostäder säkrats)

### Möjliga nästa steg (Prio 4-idéer)
- Recensioner/case-studie-sektion (när första kunden finns)
- "Glömt lösenord"-funktion (Resend återställningsmail)
- Bokningskalender-vy för admin
- Fler bostadsbilder / signature-bild till OG

## Dag 8

### Säkerhetsfixar efter extern kodgranskning (KODGRANSKNING.md)

KRITISKA HÅL TÄPPTA:
- Registrering kan inte längre sätta roll — `roll` från request-body ignoreras,
  alla nya konton blir "hyresgast" (tidigare kunde vem som helst POSTa roll:"admin")
- Publika API:er läcker inte längre kunduppgifter: GET /api/bostader,
  /api/bostader/[id] och /api/rum/[id] returnerar nu bara
  id/startdatum/slutdatum/status på bokningar (tidigare: namn, e-post, telefon,
  org.nr på alla kunder — öppet för vem som helst)
- JWT_SECRET-fallback borttagen: servern vägrar starta i produktion om
  miljövariabeln saknas (tidigare tyst fallback till publik känd sträng)
- Rate-limiting på alla öppna POST-endpoints (logga-in, registrera, bokningar,
  offert, hyresvardar) — ny hjälpare lib/ratelimit.ts (in-memory, per instans;
  kan bytas mot Upstash Redis senare utan att ändra anropen)
- Timing-skydd i logga-in: bcrypt-jämförelse körs alltid så svarstiden inte
  avslöjar vilka e-postadresser som är registrerade

BOKNINGSFLÖDET LAGAT (största funktionella bristen):
- En obekräftad förfrågan låser INTE längre rummet — endast status "bekraftad"
  blockerar tillgänglighet (tidigare gjorde en enda anonym förfrågan att rummet
  visades som "Bokat tills vidare" i 10 år, utan sätt att ångra)
- Ny API-route: PATCH /api/bokningar/[id] (admin) — bekräfta/avboka + sätt slutdatum
- GET /api/bokningar?alla=1 (admin) — hämtar samtliga bokningar
- Ny admin-flik "Alla bokningar" i dashboard med Bekräfta/Avboka-knappar
  och slutdatum-fält
- /bostader-listan räknar nu "lediga rum" från bekräftade bokningar istället
  för det statiska rum.status-fältet (som aldrig uppdaterades)

ÖVRIGT:
- Lösenord minst 8 tecken vid registrering (tidigare 6; matchar nu byt-lösenord)
- Roll-väljaren "Jag vill hyra / hyra ut" borttagen från registreringssidan
- Kvarglömd "UthyrningsBostäder"-logga på registreringssidan bytt till ReLoka
- Bokningar max 24 månader fram i tiden (tidigare obegränsat)
- Verifierat: npm run build går igenom utan fel

### VIKTIGT ATT GÖRA MANUELLT
- Sätt befintliga riktiga bokningar till status "bekraftad" via nya admin-fliken
  (eller SQL) — annars visas rummen som lediga eftersom "forfragan" inte längre blockerar
- Verifiera att JWT_SECRET är satt i ALLA Vercel-miljöer (Production, Preview,
  Development) — annars failar deployen nu (avsiktligt)

### Kvar från granskningen (ej blockerande)
- Zod-validering på alla POST-endpoints (400 istället för 500 vid fel typ av data)
- Index i schema.prisma: Bokning(rum_id, status, email), Rum(bostad_id)
- Automatiserade tester enligt testlistan i granskningen

## Dag 9

### Sprint: produktionsklart inför första kunderna (reloka.se live)

DOMÄN reloka.se:
- BASE_URL bytt till https://reloka.se i app/sitemap.ts + app/robots.ts
- metadataBase satt i app/layout.tsx (absoluta OG-/delningslänkar)
- e2e-live.js + dokument uppdaterade från gamla vercel-URL:en

MEJL:
- lib/email.ts: fallback-avsändare no-reply@reloka.se, avsändarnamn "ReLoka <adress>"
- Avsändare styrs fortsatt av AVSANDAR_EMAIL — MÅSTE uppdateras till
  no-reply@reloka.se i .env.local + Vercel (alla tre miljöer)

KONTAKTUPPGIFTER CENTRALISERADE (ny fil lib/kontakt.ts):
- TELEFON_VISNING + TELEFON_LANK — platshållare <<TELEFONNUMMER_HÄR>>,
  byts på EN plats när riktigt nummer finns (tel: i +46-format)
- ORGNR_VISNING = "under registrering" — byts på EN plats efter Bolagsverket
- app/page.tsx (kontakt-CTA + footer) och OffertModal använder konstanterna

DUBBELBOKNINGSSKYDD:
- POST /api/bokningar: tillgänglighetskontroll + skapande i prisma.$transaction
  med Serializable-isolering
- PATCH /api/bokningar/[id]: vid bekräftelse kontrolleras i samma transaktion
  att ingen annan bekräftad bokning på rummet överlappar perioden
  (slutdatum null = tills vidare = överlappar allt framåt) → 409 vid krock
- Serialiseringskonflikt (P2034) vid samtidiga anrop → tydligt 409-fel
  istället för dubbelbokning
- Affärsregeln oförändrad: bara "bekraftad" blockerar, "forfragan" blockerar inte

SMÅFIXAR:
- Bostadstyp-dropdown i "Lägg upp bostad" (privat_rum/rum_eget_bad/hel_lagenhet),
  valideras och sparas i POST /api/bostader
- previewFeatures ["driverAdapters"] borttagen ur schema.prisma (numera default),
  prisma generate kört utan varningar

### ATT GÖRA MANUELLT (Muamer)
- Sätt AVSANDAR_EMAIL=no-reply@reloka.se i .env.local OCH Vercel (Production,
  Preview, Development)
- Byt <<TELEFONNUMMER_HÄR>> i lib/kontakt.ts (två rader: visning + tel:-länk)
  [KLART 2026-07-06 — riktigt nummer inlagt]
- Byt ORGNR_VISNING i lib/kontakt.ts när org.nr kommer från Bolagsverket

## Dag 20

### Rumstyp och del av huset per rum (inför Tjädergatan 17)
Första riktiga bostaden är ett hus med tre sorters boende: fem rum som delar
badrum (övre våningen), tre rum med eget badrum (nedre våningen) och en egen
bostad i ett ombyggt garage (Gårdshuset). Typen låg tidigare på Bostad, så
filtret "Rum med eget bad" hade antingen missat nedre våningen eller visat
övre våningen felaktigt. Därför ligger typen nu per rum.

- Rum fick `bostadstyp` (default privat_rum, samma värden som Bostad) och
  `sektion` (fritext, t.ex. "Övre våningen"). Migrationen
  20261004083010_rum_bostadstyp_och_sektion lägger bara till kolumner med
  default eller NULL, så den kan köras medan den gamla koden är i drift.
  Bostad.bostadstyp ligger kvar som reserv för bostäder utan rum.
- NY FIL lib/bostadstyp.ts: typvärden, etiketter och reglerna. Filtret
  matchar om bostaden ELLER något rum har typen. Typmärkena visar alla typer
  bland rummen. Rumskorten säger Delat badrum / Eget badrum / Hel lägenhet.
- /bostader filtrerar via rummen och kortet visar alla typer. Bostadssidan
  grupperar rummen med en rubrik per sektion, i den ordning sektionerna först
  dyker upp, och visar typen på varje rumskort. Rumssidan visar typ och del
  av huset.
- /api/bostader sorterar nu rummen på created_at, som bostadssidans API
  redan gjorde. Rummen visas alltså i den ordning de lades upp.
- Dashboarden "Lägg upp rum": nya fält Del av huset (föreslår sektionerna
  som redan finns, eftersom en stavningsvariant blir en egen rubrik) och
  Rumstyp (förvald efter bostadens typ).

### Två dashboardbuggar hittade och rättade
- Formulären skickar null för tomma fält (kvm: null, adress: null ...), men
  valideringen godtog bara tom sträng. "Lägg upp rum" utan kvm och "Lägg upp
  bostad" utan alla valfria fält ifyllda gav därför 400. tomBlirUndefined i
  lib/validering.ts gör nu null till undefined.
- Bilduppladdningen tömdes inte efter sparning, så förra rummets bilder
  följde med nästa rum. Den monteras nu om efter varje sparning. Spara-
  knappen är dessutom låst ("Väntar på bilder...") tills pågående
  uppladdningar är klara. Annars kom bilder som inte hunnit klart inte med.

### Bildbehandling och importskript
- NY FIL lib/bildbehandling.ts: samma bearbetning för /api/upload och för
  skript (EXIF-rotation, max 1920 px bredd, WebP q85).
- NYTT SKRIPT scripts/importera-tjadergatan.mts lägger upp Tjädergatan 17
  med 9 rum och 27 bilder. Det körs med `node` (Node 24 kör TypeScript
  direkt). Utan `--skarpt` gör det bara en torrkörning, och okända argument
  stoppar det, så en felstavad flagga kan aldrig ge en skarp körning.
  tsconfig fick allowImportingTsExtensions så att bygget kan typkontrollera
  skriptet.

### Startsidan och e2e-skriptet
- Startsidans "från"-priser var hårdkodade (9 000 / 12 000 / 18 000 kr).
  Nu räknas de ur databasen: lägsta månadshyra bland rummen av varje typ,
  och "Pris på förfrågan" om typen saknar rum. Sidan byggs statiskt och byggs
  om i bakgrunden högst en gång i timmen (revalidate = 3600). Svarar inte
  databasen under bygget byggs sidan utan priser, så deployen stoppas inte.
- e2e-live.js hade testkontots lösenord i klartext i det publika repot. Det
  läses nu från miljövariabeln E2E_LOSENORD. Testkontot raderas vid
  rensningen, så det gamla lösenordet i git-historiken leder ingenstans.

### Verifierat
test:api 11/11 mot en isolerad lokal Postgres, aldrig mot Neon. De nya
testerna faller om respektive rättning tas bort. Lint 0 fel, tsc och build
gröna. Lokal förhandsvisning i dator- och mobilvy (Playwright), inklusive
"Lägg upp rum" på riktigt.

MIGRATIONEN ÄR BAKÅTKOMPATIBEL, bevisat lokalt: koden som ligger live
(origin/main) kördes mot en migrerad databas. Dess egna 7 tester var gröna,
och dess POST /api/rum gav 201 med bostadstyp 'privat_rum' och sektion NULL
ifyllda av databasen.

### ATT GÖRA, i den här ordningen (stanna efter varje punkt)
Muamer först: PR + grön CI, Neon-branch backup-2026-10-05 (BACKUP.md,
Skyddsnät 1) och BLOB_READ_WRITE_TOKEN i .env.local. Rensningen raderar
bokningar via cascade och går inte att ångra utan backupen.
1. `npx prisma migrate deploy` mot produktion (efter "kör migrationen")
2. Radera testdatan med exakta id:n (efter "kör rensningen"): testbostaden
   med rum och bokningar, 13 testkonton (ako.brankovic@outlook.com behålls
   som enda admin), 7 offertförfrågningar, testbostadens 2 bilder och 2
   kontrakts-PDF:er i Blob
3. Kör importskriptet: först utan flagga (torrkörning), sedan med `--skarpt`
4. Merga, så att Vercel deployar (sitemap.xml får då med Tjädergatan 17)
5. Kontrollera reloka.se
Därefter, i en egen PR: spärr så att testsviten inte kan köras mot
produktionsdatabasen.

OBS: Preview-deployer har samma DATABASE_URL och BLOB-token som produktion
(DEPLOY.md). Prova aldrig saker i en previews dashboard, eftersom det skriver
till produktionen.

## Dag 19

### Statusvärden samlade på ett ställe — lib/bokningsstatus.ts
Utlöstes av att fliken "Förfrågningar" visade (0). Felsökningen visade att
flikfiltret var RÄTT: två bokningar från 2026-05-20 har status "aktiv" i
databasen, ett värde som inte finns någonstans i koden och som inte tillåts
av zod-schemat. Det som dolde detta var badge-funktionen, som föll tillbaka
på "Förfrågan" för okända värden — bokningarna SÅG ut som förfrågningar
fast de inte var det.

STATUS I DATABASEN (2026-08-04): avbokad 6, bekraftad 3, aktiv 2. Noll
faktiska förfrågningar — därför är (0) korrekt.

NY FIL lib/bokningsstatus.ts: BOKNING_STATUS, KONTRAKT_STATUS,
FAKTURA_STATUS + arBokningStatus(). Inkopplad i 12 filer — validering,
alla API-rutter (inkl. dubbelbokningsskyddets frågor), e-postmodulen,
dashboarden, bostads- och rumssidorna. Noll lösa statussträngar kvar i
app/ och lib/. Värdena är oförändrade, bara källan är gemensam.

OKÄNDA VÄRDEN DÖLJS INTE LÄNGRE: badgen visar "Okänd status: aktiv" i
gult, och bokningen hamnar i "Kräver åtgärd" med "Behöver: okänd status
(aktiv)" — i stället för att försvinna ur alla arbetsflikar.

VERIFIERAT mot riktig data: 13/13 kontroller, flikantalen jämförda mot
oberoende uträkning ur databasen, ingen bokning saknar hem, "Kräver åtgärd"
dubbelräknar inte. tsc + build gröna, test:api 7/7.

DATANORMALISERING (godkänd av Muamer 2026-08-04): de två "aktiv"-raderna
(Test Person / Test Person 2, test@test.se) sattes till "avbokad" med en
UPDATE scopad till status='aktiv'. Historiken finns alltså kvar, men de
blockerar inga rum och kräver ingen åtgärd. "bekraftad" var inget alternativ
— båda hade krockat med befintliga bekräftade bokningar på samma rum.
Statusfördelning efter: avbokad 8, bekraftad 3. Noll okända värden kvar.
Flikarna efter: Kräver åtgärd (2), Förfrågningar (0), Bekräftade (3),
Avbokade (8), Alla (11) — 11/11 kontroller gröna.

## Dag 18

### "Alla bokningar" omstrukturerad (admin) — VYN, inte logiken
Bokningslogik, dubbelbokningsskydd, mejlutskick och PATCH-anropen är
oförändrade. Det som byggts om är hur bokningarna presenteras.

NYA FILER:
- app/dashboard/AllaBokningar.tsx (692 rader) — hela vyn flyttad hit
- app/dashboard/typer.ts — RumInfo + AdminBokning, delas av page.tsx och vyn
- app/dashboard/page.tsx krympte 1771 -> 1267 rader

UNDERFLIKAR (konfigureras i UNDERFLIKAR-arrayen överst i AllaBokningar.tsx):
- Kräver åtgärd (default) / Förfrågningar / Bekräftade / Avbokade / Alla
- Antal räknas ut automatiskt per flik, på HELA listan (siffrorna står stilla
  medan man söker). "Kräver åtgärd" får grön siffra när den är > 0.
- Samma streck-stil som huvudflikarna. OBS: stilen är duplicerad, inte delad —
  ändrar du flikstilen i page.tsx måste du ändra den i AllaBokningar.tsx också.

"KRÄVER ÅTGÄRD" räknas av EN funktion, saknasFor(), som både fliken och
raden "Behöver: ..." på korten använder — de kan alltså aldrig säga emot
varandra. Regler: förfrågan -> "svar på förfrågan"; bekräftad + kontrakt
saknas -> "kontrakt"; bekräftad + ej fakturerad -> "fakturering"; avbokade
kräver ingenting.

KOMPAKTA KORT:
- Sammanfattning alltid synlig: företag (annars kontaktperson), rum + bostad,
  start–slut ("tills vidare" om slutdatum saknas), statusbadge, samt två små
  indikatorer "Kontrakt: ..." / "Faktura: ...".
- Detaljer bakom "Visa detaljer": kontaktuppgifter som klickbara länkar,
  org.nr, boende, avtalstyp, hyra, inkom-datum, bekräfta/avboka/slutdatum
  och hela kontrakts- + fakturasektionen.
- FLERA kort får vara öppna samtidigt (man jobbar igenom en hög åt gången).
- Hela sammanfattningsraden är en <button> med aria-expanded + aria-controls,
  fungerar med tangentbord utan extra kod.

SÖK + SORTERING (klientsidan, på redan hämtad data — inga extra API-anrop):
- Söker i företag, kontaktperson, e-post, boende, rummets och bostadens namn.
- Skiftlägesokänslig, filtrerar inom vald flik.
- Tom träfflista ger "Inga träffar för ..." + knappen "Rensa sökning".
- Sortering: Nyast först (standard) / Äldst först / Startdatum.

VERIFIERAT (Playwright mot dev-server, engångs-admin, självstädande):
42/42 kontroller gröna — flikantal jämförda mot oberoende uträkning ur
databasen, sökning, sortering, expandering (mus + Enter), mobil, samt
regressioner: bekräfta, avboka, slutdatum, fakturastatus, kontraktstatus
och dubbelbokningsskyddet via UI ("Rummet har redan en bekräftad bokning
som överlappar den här perioden"). tsc + build gröna, test:api 7/7.
All testdata raderad efteråt — de 11 riktiga bokningarna orörda.

FALLGROP FÖR FRAMTIDA TESTER: fliketiketterna "Bekräftade"/"Avbokade"
innehåller texterna "Bekräfta"/"Avboka". En selektor som
button:has-text("Bekräfta") träffar alltså FLIKEN, inte åtgärdsknappen —
scopa alltid till kortets detaljblock (#bokning-detaljer-<id>).

KVARSTÅR (befintligt, ej infört av denna ändring): eslint klagar på
oescapade citattecken i "Lägg upp bostad"-fliken (page.tsx rad 362).

## Dag 17

### En stad: Norrköping borttaget ur hela UI:t
- 0 träffar kvar på "Norrköping" i kod. Ändrat i: layout.tsx (title,
  description, OG, Twitter), page.tsx (hero-badge, metadata, footer),
  Navbar (logo-underrad), bostader, hyresvardar, om-oss, offert/layout,
  offert (stad-dropdown), villkor, opengraph-image (twitter-image ärver),
  lib/email.ts (endast varumärkesraden i mallhuvudet — ingen utskickslogik).
- /bostader: stad-filtret HELT borttaget (state, toggle, ?city-param och
  filtervillkoret). Bostadstyp- och prisfiltret orört.
- /hyresvardar: stad-dropdownen borttagen ur formuläret. Fältet skickas
  fortfarande som stad: "Linköping" så API/lead-data ser likadan ut.
- /offert: stad-dropdownen har kvar Linköping + Annan (stad krävs av zod).
- KVAR MED FLIT: PROJEKT_STATUS.md och KODGRANSKNING.md nämner Norrköping i
  daterade historikposter — dokumentation, inte kod, och ska inte skrivas om.

### Startsidan
- Sektionen "Välj servicenivå" (Medlemskap/Standard/Premium) BORTTAGEN i sin
  helhet. Avtalstyp i bokningsmodalen, dashboarden och e-postmallarna är
  ORÖRD — det var bara säljsektionen som togs bort.
- "Lokal närvaro": de fyra nyckeltalen (48h/100%/1/2h) borttagna, kvar är
  rubriken "Vi kan Linköping inifrån och ut" + brödtexten. Sektionen smalnades
  till max-w-2xl och nedre marginalen togs bort så den ser balanserad ut.
- Hero-rubrik: "utan krångel eller mäklare" → "utan krångel".
- "Med ReLoka istället": "från 1 månad" struket, kontaktperson/faktura-punkten
  borttagen, wifi-punkten omskriven. 4 → 3 punkter (grid är items-center).

### Flikar visar var man befinner sig
- Dashboardens flikrad bytte från pill-stil till understruken flik:
  3px grönt (#2D7A4F) understreck + text-[#1a1a1a] font-semibold på aktiv,
  transparent kant + gray-400 på inaktiv. Raden ligger på en border-b-linje
  med -mb-px så strecket möter linjen. Scrollar horisontellt på mobil.
  role="tablist"/role="tab"/aria-selected tillagt.
- Enda flikraden i appen — verifierat med grep.

### Bostadssidan
- "Om bostaden" visas nu ALLTID (tidigare bara när beskrivning fanns).
  Egen beskrivning splittas på tomrad till flera stycken; saknas den visas
  standardBeskrivning() — tre stycken löptext (möblerat/inflyttningsklart,
  egen nyckel, wifi+hushållsel, kollektivtrafik, flexibla avtal,
  en kontaktperson). Anpassas efter bostadstyp och använder delade_utrymmen
  + narmaste_hallplats när de är ifyllda.
- "Vad ingår"-chippen: ny formateraInkluderat() städar visningen —
  inledande "och " bort + versal begynnelsebokstav. Chippet "och sophämtning"
  visas därmed som "Sophämtning". DATAN ÄR ORÖRD; texten kommer från
  Bostad.inkluderat och står i databasen som
  ["El","varmvatten","internet","och sophämtning"] (fritext med komma som
  splittas). Vill ni ha den ren i databasen får den redigeras i dashboarden.

### För hyresvärdar
- "Anmäl din bostad" → "Registrera din bostad" (processteg 1 + formulärrubrik),
  knappen "Skicka anmälan" → "Registrera bostad", bekräftelsen
  "Tack för din anmälan!" → "Tack för din registrering!".
- "Vi återkommer inom 24 timmar på vardagar." borttagen. Även 24h-löftet i
  processteg 1, bekräftelserutan och FAQ:ns hyresvärdsfråga ersatt med
  "vi hör av oss". FAQ-frågan heter nu "Hur registrerar jag min bostad?".

### Om oss
- Ingressen under "Vi byggde det vi saknade" ersatt med den nya visionstexten.
- Endast en grundare: "Muamer Ako Brankovic". Tvåkolumnsgriden ersatt med ett
  centrerat kort (max-w-lg mx-auto text-center, avatar mx-auto) så det inte
  hänger i en tom kolumn. Rubrik "Grundarna" → "Grundare".
- "Vår historia" omskriven utan Mahir och utan Norrköping.
- Värderingar: Enkelhet, Kunskap, Relationer med nya beskrivningar.

### Telefonnummer
- TELEFON_VISNING = "076-058 65 25" (TELEFON_LANK var redan rätt).

### Verifierat
- grep Norrköping i kod: 0. grep Mahir i app/: 0.
- npx tsc --noEmit: rent. npm run build: OK (28 sidor).
- npm run test:api: 7/7 gröna.

## Dag 16

### Grupp 3, DEL 1-3 (DEL 4 = beslutsunderlag, ej byggt)

DEL 1 — DATABASINDEX + STÄDNING (migration 20260730113426):
- Index tillagda utifrån verkliga frågemönster i app/api/:
  * Bokning(rum_id, status) — tillgänglighets-/överlappskontroller
    (bostadslista/-sida, boknings-POST, PATCH-bekräftelse)
  * Bokning(created_at) — admin "Alla bokningar" sorterar på created_at desc
  * Rum(bostad_id) — rum laddas per bostad; FK indexeras ej automatiskt i Postgres
  * Offertforfragan(created_at), Hyresvardsanmalan(created_at) — admin-listornas sortering
- AVVIKELSE från granskningens förslag: INGET Bokning(email)-index — email
  frågas inte längre (Mina bokningar bytte till anvandare_id, redan indexerat).
  Behovet finns alltså inte i koden.
- Rum.status BORTTAGET: verifierat med grep att inget läser fältet (logik
  räknar från bokningar). Tre frontend-typer deklarerade det oanvänt — städat.
  Migrationen skapades manuellt + prisma migrate deploy (migrate dev vägrar
  radera kolumn med data icke-interaktivt).

DEL 2 — TILLGÄNGLIGHET (WCAG basnivå):
- Labels kopplade (htmlFor + id) i ALLA formulär: /offert, /hyresvardar,
  /logga-in, /registrera, bokningsmodalen, MittKonto, LaggUppBostad,
  LaggUppRum, lead-noteringen (unik id per ärende).
- Global fokusring i globals.css via :focus-visible (grön, endast tangentbord).
- Kontrast: gray-400 → gray-500 på labels/hjälptext (2.8:1 → ~4.5:1 AA).
  Varsamt — dekorativa mikrotexter och placeholders orörda.
- Modaler (BokningsModal + OffertModal): fokusfälla (Tab cirkulerar),
  fokus flyttas in vid öppning + åter vid stängning, Escape stänger,
  role="dialog" + aria-modal + aria-labelledby (bokning) / aria-label (offert).
- Alt-texter: genomgångna — bostads-/rums-/kontaktbilder använder namn,
  galleriets miniatyrer alt="" (dekorativa, knapp har aria-label).
  Admin-uppladdningens förhandsvisning fick alt="Uppladdad bild".
- autoComplete tillagt på e-post/namn/lösenord för bättre ifyllnad.

DEL 3 — BACKUP.md skapad: Neon-branch + pg_dump-rutin, återställning, samt
att Vercel Blob-filer (bilder/kontrakt-PDF) INTE ingår och säkras separat.
Skriven för icke-utvecklare.

VERIFIERAT: tsc + build gröna. test:api 7/7 (bokningsflöde/dubbelbokning
intakt). Migration applicerad på Neon.

PÅMINNELSE: starta om dev-servern (prisma generate kördes).
DEL 4 (Sentry) — se rapport, inväntar beslut.

## Dag 15

### Lead-uppföljning för offert + hyresvärd (admin-arbetsflöde)

DATAMODELL (additiv migration 20260723114533_lead_uppfoljning):
- Offertforfragan: intern_notering (@db.Text) + uppdaterad (DateTime?).
  Det BEFINTLIGA status-fältet återanvänds — default bytt "ny" → "obehandlad".
  Äldre rader kan ha legacy "ny"; UI/räknare/sortering behandlar "ny" (och
  varje okänt värde) som "obehandlad" → syns som lead att ta tag i. Backfillar inget.
- Hyresvardsanmalan: nya status (default "obehandlad") + intern_notering + uppdaterad.
- Statusvärden: offert = obehandlad|kontaktad|offert_skickad|vunnen|forlorad,
  hyresvärd = obehandlad|kontaktad|pagaende|avtal_klart|ej_aktuell.

API (admin-skyddat, ny PATCH):
- PATCH /api/offert/[id] och /api/hyresvardar/[id] — requireAdmin, Zod-validerad
  (enum-status, notering max 2000), sätter uppdaterad=now(), 404 om saknas.
  Ingen mejl skickas (interna fält).
- PII: publika POST-svaren (/api/offert, /api/hyresvardar) vitlistades till
  { ok, id } — status/intern_notering läcker aldrig ut. Publika endpoints rör
  inte dessa modeller alls i övrigt. Mejlutskicken orörda (bara svarsformen ändrad).

ADMIN-UI (delad LeadFlik/LeadKort-infrastruktur, båda flikarna):
- Räknare högst upp: grön framträdande pill "N obehandlade — kräver handling"
  när >0, annars "Inga obehandlade just nu"; övriga statusar som dämpad text.
- Sortering: obehandlade överst → aktiva → avslutade sist; nyast först i grupp.
  Avslutade tonas ner (opacity-60).
- Färgkodad badge: obehandlad=grön accent, kontaktad/pågående=amber,
  offert_skickad=blå, vunnen/avtal_klart=fylld grön, förlorad/ej_aktuell=grå.
- Status-dropdown med svenska etiketter, optimistisk uppdatering + rollback vid fel.
- Intern anteckning per ärende (textruta, Spara + "✓ Sparat", "Uppdaterad <tid>").
- Kontaktgenvägar: tel:/mailto:-länkar. Långa meddelanden: "Visa mer".
  Mobilanpassat. Ny hjälpare formateraDatumTid i lib/datum.ts.

VERIFIERAT: tsc + build gröna. Testsviten (npm run test:api) 7/7 — inga
regressioner. Riktad verifiering (15 checks): vitlistade POST-svar, PATCH
401/403-skydd, status+notering sparas, ogiltig status/notering>2000 → 400.

PÅMINNELSE: starta om dev-servern (npx prisma generate kördes) innan test.

## Dag 14

### ROOT CAUSE: statusmejl skickas inte i PRODUKTION (fungerade lokalt)

PROBLEMET: alla fyra mejlutskick var fire-and-forget — promisen skapades
med .catch() men awaitades ALDRIG före return Response.json(). På Vercel
fryses/rivs serverless-funktionen så fort svaret returnerats, så en
icke-awaitad promise hinner ofta inte fullborda HTTP-anropet till Resend.
Lokalt lever Node-processen kvar och hinner klart → fungerade på localhost
men misslyckades tyst i produktion.

VARFÖR FÖRFRÅGAN "FUNGERAR" MEN STATUS INTE: samma flaw i båda — skillnaden
är container-livscykel, inte kodstruktur. Publika POST /api/bokningar
träffas ofta → containern hålls varm → frusen bakgrundspromise återupptas
vid nästa request och hinner skicka. Admin-PATCH /api/bokningar/[id] träffas
sällan → containern blir kall och rivs innan promisen körts → mejlet tappas.
Förfrågan-mejlet var alltså heller INTE garanterat.

VARFÖR LOGGEN "LJÖG": route-loggen "skickar statusmejl till X" skrivs
synkront FÖRE fire-and-forget-anropet, oavsett utfall. (Funktionen i
lib/email.ts är korrekt — loggar "skickat" först efter awaitad send +
felkoll — men hann inte köra klart i prod.)

FIX: await på alla fyra utskicken (behåll .catch så mejlfel inte blockerar
DB-operationen logiskt, men vänta in utskicket före svaret):
- PATCH /api/bokningar/[id] (skickaBokningsstatusMail)
- POST /api/bokningar (skickaBokningsmail)
- POST /api/offert (skickaOffertmail)
- POST /api/hyresvardar (skickaHyresvardsnotisMail)
Pris: ~0,2–0,5 s extra svarstid per anrop — acceptabelt.

Env: RESEND_API_KEY/AVSANDAR_EMAIL är bevisligen satta i Production (annars
hade förfrågan-mejlet inte fungerat) — inte orsaken. Ingen ny env behövs.
Kan inte reproduceras lokalt (frysningen sker bara på Vercel). Verifieras
efter deploy. tsc + build gröna.

## Dag 13

### Grupp 2, DEL 1 — mejl vid statusändring + hyresvärdsnotis

KUNDMEJL VID BEKRÄFTELSE/AVBOKNING (lib/email.ts):
- Ny funktion skickaBokningsstatusMail(bokning, rum, bostad, nyStatus)
  med html + text-version, samma stil som övriga mejl
- Bekräftad: "Din bokningsförfrågan är bekräftad" — sammanfattning (rum,
  bostad, plats, hyra, startdatum, slutdatum/"Tills vidare", avtalstyp)
  + vad som händer härnäst (kontrakt/inflytt) + kontaktuppgifter
- Avbokad: "Angående din bokningsförfrågan" — neutral, artig, välkomna åter
- Reply-to = ADMIN_EMAIL; skickas bara om bokningen har giltig e-postadress
- Inkopplat i PATCH /api/bokningar/[id]: skickas EFTER lyckad DB-uppdatering,
  endast när status FAKTISKT ändras till bekraftad/avbokad (inte vid t.ex.
  bara slutdatum-ändring eller om samma status sparas igen)
- Fail-safe: fire-and-forget med .catch — mejlfel blockerar aldrig statusändringen

ADMINNOTIS VID NY HYRESVÄRDSANMÄLAN (tidigare sparades leads osedda):
- Ny funktion skickaHyresvardsnotisMail(anmalan) — html + text, till
  ADMIN_EMAIL, ämne "Ny hyresvärdsanmälan från {namn}", alla fält
- Reply-to = anmälarens e-post (svara direkt från notisen)
- Inkopplat i POST /api/hyresvardar efter att anmälan sparats, fail-safe

Verifierat: tsc + npm run build gröna. Auth, dubbelbokningsskydd, Zod och
kontrakt/faktura orörda.

### Grupp 2, DEL 2 — automatisk API-testsvit

- Ny fil tests/api.test.js (Nodes inbyggda testrunner) + npm-script
  "test:api". Körning: starta dev-servern (npm run dev) i ett fönster,
  kör `npm run test:api` i ett annat.
- 7 test som bevisar de kritiska reglerna:
  1. Roll-injection omöjlig (registrera med roll:"admin" → hyresgast,
     verifierat i både API-svar och databas)
  2. Ingen PII/kontrakt_url i publika svar (bostader, bostader/[id],
     rum/[id]) — bokningsobjekt är exakt vitlistan id/startdatum/slutdatum/status
  3. Förfrågan blockerar inte rum (syns inte publikt, andra förfrågan tillåts)
  4. Dubbelbokningsskydd: överlappande bekräftelse → 409,
     icke-överlappande → 200
  5. Skräpdata → 400 (aldrig 500): trasig JSON, ogiltig telefon, e-post
     som siffra, namn som objekt, månadshyra "abc", påhittad status
  6. Mina bokningar-isolering: användare ser bara egna bokningar
     (anvandare_id), inga kontraktfält, 401 utloggad
  7. Admin-skydd: bostader/rum/upload/kontrakt/alla-bokningar/PATCH →
     401 utan inloggning, 403 som hyresgast
- Självstädande: skapar egen testdata ([TEST]-bostad, @test.reloka.internal-
  användare, engångs-admin med slumpat lösenord direkt i DB) och raderar
  allt efteråt + förstädar skräp från kraschade körningar. Verifierat:
  0 testrader kvar i databasen efter körning.
- Rate-limitern kringgås i test via slumpad x-forwarded-for per körning
  (fungerar endast lokalt — produktionsskyddet påverkas inte)
- Resultat: 7/7 pass, två körningar i rad (omkörningar fungerar)
- Inga riktiga lösenord/hemligheter i testkoden

## Dag 12

### Innehållsstädning (trovärdighet/juridik)
- Fabricerad kundrecension ("Anna K., HR-chef") borttagen från startsidan —
  inga kunder finns än, påhittade recensioner är vilseledande marknadsföring
- "Lokal närvaro"-sektionen omgjord till centrerad layout med 4 stat-kolumner
- "48h Genomsnittlig tid..." → "48h Vårt mål: från kontakt till avtal"
- "2h Svarstid på vardagar" → "2h Vi svarar inom 2 timmar på vardagar"
- "100% Besiktade och godkända bostäder" kvar (policy, inte statistik)

### Ny layout: galleri vänster + sticky infopanel höger (desktop lg:)
- /bostad/[id]: Bildgalleri (60%) + nytt "Fastighetskort" (40%, sticky top-24)
  med namn/stadsdel/bostadstyp-badge, nyckelfakta med ikoner (antal rum,
  lediga nu, från-pris, hållplats), delade utrymmen + inkluderat som chips,
  CTA "Se lediga rum" som scrollar mjukt till rumssektionen (scroll-mt-24)
- Gamla Faktarad (4 stat-kort) BORTTAGEN — fastighetskortet visar samma
  info; att ha båda hade dubblerat innehållet. "Närmst ledigt"-datumet utgick
  (syns per rum på rumskorten); från-pris tillkom istället
- Separata "Delade utrymmen"/"Vad ingår"-korten borttagna (nu chips i kortet);
  "Om bostaden"-beskrivningen ligger kvar i egen full-bredd-sektion
- Mobil: staplar galleri → infokort → beskrivning → rum
- /rum/[id]: bytte md: → lg: på tvåkolumnslayouten + lg:sticky på boknings-
  panelen så breakpoint/beteende matchar bostadssidan
- Rumskort, status-cirklar, hover-overlay, bottom sheet: orörda

### Kontrakthantering (admin)
- Migration 20260708090955_kontrakt_faktura (additiv): Bokning fick
  kontrakt_url, kontrakt_status (default "saknas"), kontrakt_uppdaterad,
  faktura_status (default "ej_fakturerad")
- Ny route POST /api/kontrakt (requireAdmin): endast application/pdf,
  max 4 MB (under Vercels 4,5 MB-gräns), laddas till Vercel Blob med
  addRandomSuffix (ogissbar URL — kontrakt innehåller persondata),
  sparar url + status "uppladdat" + tidsstämpel
- PATCH /api/bokningar/[id] utökad: kontrakt_status + faktura_status
  (Zod-enum-validerade); kontrakt_uppdaterad sätts vid statusbyte;
  all bekräfta/avboka/slutdatum-logik orörd
- Admin-UI i "Alla bokningar": Kontrakt-sektion per bokning med statusbadge
  (saknas=grå, uppladdat=blå, skickat=gul, signerat=grön), Ladda upp/Ersätt
  PDF, "Visa kontrakt" (ny flik), status-dropdown, inaktiv "Skicka för
  e-signering"-knapp ("Scrive-integration kommer snart")

### Fakturering (platshållare, admin)
- Faktura-badge (ej fakturerad=grå, fakturerad=gul, betald=grön) +
  dropdown — endast på bekräftade bokningar (förfrågningar faktureras inte)
- Text: "Fakturering sker manuellt. Integration med bokföringssystem
  (Fortnox/Bokio) planeras."

### PII-skydd verifierat
- Publika GET (bostader, bostader/[id], rum/[id]) har select-vitlistor —
  kontrakt-/fakturafälten kan inte läcka där
- GET /api/bokningar ("Mina bokningar", inloggad) vitlistades också —
  kontrakt_url exponeras nu ENDAST i admin-vyer (?alla=1 + PATCH-svar)
- Verifierat med grep: kontrakt_url förekommer bara i admin-route,
  admin-UI och kommentar

## Dag 11

### Grupp 1 från förbättringsplanen (efter godkänd prioritering)

BOKNING KOPPLAD TILL KONTO (stänger "Mina bokningar"-läckan):
- Ny migration: nullable kolumn anvandare_id på Bokning + relation till
  Anvandare (onDelete: SetNull) + index. Migrationen är applicerad på Neon.
- POST /api/bokningar sätter anvandare_id när en inloggad användare bokar
  (kontot verifieras i transaktionen). Anonym bokning fungerar exakt som förut.
- GET /api/bokningar ("Mina bokningar") filtrerar nu på anvandare_id —
  ALDRIG på e-post (e-post är overifierad och gick att kapa genom att
  registrera ett konto med någon annans adress)
- OBS: bokningar skapade FÖRE denna ändring har anvandare_id = null och
  visas inte under "Mina bokningar" (admin ser allt via "Alla bokningar")

ZOD-VALIDERING PÅ ALLA SKRIVANDE ENDPOINTS (npm-paket zod installerat):
- Ny fil lib/validering.ts: scheman + validera()-hjälpare + lasJson()
  (trasig JSON ger nu 400 istället för 500 överallt, även POST /api/bostader
  som helt saknade try/catch)
- Endpoints: registrera, logga-in, byt-losenord, bokningar (POST),
  bokningar/[id] (PATCH), offert, hyresvardar, bostader, rum
- Typer, e-postformat, telefonregex (återanvänder lib/telefon.ts), enums för
  status/avtalstyp/bostadstyp, maxlängder på alla textfält (skyddar mot
  megabyte-skräp), coerce av tal (kvm, manadshyra, antal_personer)
- E-post normaliseras till gemener vid registrering OCH inloggning
  (verifierat mot databasen: 0 befintliga konton med versaler → säkert)
- Svenska felmeddelanden som visas direkt i formulären

INTEGRITETSPOLICY + ANVÄNDARVILLKOR:
- Nya sidor /integritetspolicy och /villkor (statiskt renderade, i designsystemet)
- Policyn täcker: ansvarig (ReLoka AB), vilka uppgifter, ändamål/rättslig
  grund, lagringstider (förfrågningar 12 mån, avtalsdata 7 år), underbiträden
  (Vercel/Neon/Resend), cookies (endast nödvändig inloggningscookie — ingen
  banner behövs), rättigheter + IMY
- Footer: ny kolumn "Juridiskt" med båda länkarna
- Döda "användarvillkor"-länken på /registrera fixad (pekade på "#")
- Integritetspolicy-länk i offertformuläret, hyresvärdsformuläret och
  bokningsmodalen
- /integritetspolicy + /villkor tillagda i sitemap
- OBS: policytexten bör läsas av någon med juridikkoll innan ni skalar

### ATT GÖRA MANUELLT (Muamer) — kvarstår/nytt
- Signera/acceptera DPA hos Vercel, Neon och Resend (finns i deras dashboards)
- Verifiera AVSANDAR_EMAIL + ADMIN_EMAIL i Vercel
- Läs igenom policy- och villkorstexterna innan deploy

## Dag 10

### Telefonvalidering i alla formulär
- Ny delad validerare lib/telefon.ts: regex ^[+]?[\d\s-]{7,15}$ — siffror,
  mellanslag, bindestreck, valfritt inledande +
- Klientvalidering med inline-felet "Ange ett giltigt telefonnummer" och
  blockerad submit i: /offert (obligatoriskt fält), /hyresvardar (valfritt —
  valideras bara om ifyllt), bokningsmodalen på /rum/[id] (valfritt)
- inputMode="tel" satt så mobiler visar siffertangentbord
- Servervalidering (lita aldrig på klienten) i POST /api/offert,
  /api/hyresvardar och /api/bokningar → 400 vid ogiltigt nummer
- Admin-fältet kontaktperson-telefon i dashboarden lämnades utan validering
  (admin-internt, valfritt)

### E-postleverans (minska skräppostrisk) — lib/email.ts
- Reply-to satt: kundmail → ADMIN_EMAIL (svar hamnar i riktig inkorg),
  admin-notiser → kundens adress (svara direkt till kund)
- Alla fyra mail har nu plain text-version utöver HTML (viktig spam-signal)
- Avsändarnamn "ReLoka <adress>" sedan tidigare — verifierat
- Ämnesrader granskade: inga versaler/utropstecken/triggerord; mailen är
  textdominanta utan bilder
- KVAR ATT ÖVERVÄGA: riktig bemannad info@reloka.se-inkorg (kräver
  mejlhosting) — svar till no-reply studsar annars; DNS-rykte mognar med tiden

