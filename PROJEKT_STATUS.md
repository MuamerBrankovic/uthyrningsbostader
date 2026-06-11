# UthyrningsBostäder — Projektstatus

## Senast uppdaterad
2026-04-11

## Tech Stack
- Next.js (React) — frontend
- Supabase — databas & auth
- Tailwind CSS — styling
- Hosted lokalt på: http://localhost:3000

## Färdiga sidor
- / — Startsida (app/page.tsx)
- /bostader — Bostadslista med filter (app/bostader/page.tsx)
- /bostad/[id] — Detaljsida med bokning (app/bostad/[id]/page.tsx)
- /logga-in — Inloggning med Supabase auth (app/logga-in/page.tsx)
- /registrera — Registrering med Supabase auth (app/registrera/page.tsx)
- /dashboard — Dashboard för bokningar & lägg upp bostad (app/dashboard/page.tsx)

## Databas (Supabase)
- Tabell: bostader (id, city, type, price, size, tag, beskrivning, facilities)
- Tabell: bokningar (id, bostad_id, namn, email, inflyttning, utflyttning)
- Auth: Supabase inbyggd auth med email/lösenord

## Nästa steg att bygga
1. Navbar — visa Dashboard/Logga ut när inloggad
2. Sökfältet på startsidan — koppla till /bostader
3. Publicering — lägga ut hemsidan live på Vercel

## Starta projektet
1. Öppna VS Code
2. Öppna terminal (Ctrl + ö)
3. Skriv: npm run dev
4. Gå till: http://localhost:3000


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
- Live på: https://uthyrningsbostader.vercel.app

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
- Pushat till Vercel — live på https://uthyrningsbostader.vercel.app

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
- Env-variabler: RESEND_API_KEY, AVSANDAR_EMAIL (onboarding@resend.dev tillfälligt), ADMIN_EMAIL
- OBS: onboarding@resend.dev kan bara maila till egen verifierad adress tills domänen reloka.se verifierats

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
- Riktig telefon istället för 013-XXX XX XX
- Designfinputs: bildstorlekar/beskärning som såg "utdragna" ut tidigare
- "Byt lösenord"-funktion i appen (slippa manuell hash i Neon)
- Open Graph-bilder för delning på sociala medier
- Vercel Analytics + sitemap.xml
- Lägga upp första riktiga bostäder med bilder
- Sociala medier (LinkedIn viktigast för B2B, + Instagram/Facebook/TikTok)

