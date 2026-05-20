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



## Dag 5 — Plan: Polish, konvertering och tillväxt

### Mål för Dag 5
Göra hemsidan riktigt redo för första kund och marknadsföring. Fokus på 
tydlighet, förtroende och konvertering — inte fler funktioner än nödvändigt.

### Prio 1 — Bostäder och rum-upplevelsen (kärnvärdet)
- Bostadssidan ska ha tydlig huvudbild på villan/lägenheten
- Fliken "Tillgängliga rum" ska visa individuella bilder per rum
- Hover-popup på rumskort:
  - Grön cirkel-symbol + "Ledigt" + beskrivning när rummet är tillgängligt
  - Röd cirkel-symbol + "Upptaget" + datum när det blir ledigt
  - Info-text anpassad efter status (kort, tydlig, hjälpsam)
- Förbättra bildhanteringen (storlekar, beskärning, kvalitet)
- Designfinputs överallt — spacing, typografi, knappstilar

### Prio 2 — Bokning + bekräftelse
- Bekräftelsemail vid bokningsförfrågan (Resend eller liknande)
  - Mail till kunden: "Din förfrågan är mottagen"
  - Mail till oss (Mahir): "Ny förfrågan från [företag]"
- Eventuell SMS-bekräftelse på sikt (Twilio eller 46elks)
- Tydligare bekräftelsemeddelande på sajten efter skickad förfrågan

### Prio 3 — Konvertering och förtroende
- Offertformulär (egen sida /offert) — ersätter dagens enkla modal
- Tydligare CTA:er överallt — "Ring nu", "Få offert inom 3h"
- Recensioner/citat-sektion på startsidan (även om vi börjar med 1-2 fiktiva 
  innan vi har riktiga — eller hellre vänta tills första kunden)
- Case-studie-mall för när första pilotkunden är klar

### Prio 4 — Admin och säkerhet
- Admin-roll för dig och Mahir (inte alla inloggade ska kunna lägga upp bostäder)
- "Byt lösenord"-funktion i appen (slippa hasha manuellt i Neon)
- "Glömt lösenord"-funktion (Resend för återställningsmail)
- Skydd mot spam i kontaktformulär (honeypot eller enkel hCaptcha)

### Prio 5 — Marknadsföring och tillväxt
- Open Graph-bilder för delning på Facebook, LinkedIn, Instagram
- Sitemap.xml + robots.txt
- Google Analytics eller Vercel Analytics (gratis)
- Förbereda för sociala medier:
  - Facebook-företagssida (Mahir/Ako)
  - Instagram-konto
  - TikTok-konto (kort innehåll om Linköpings hyresmarknad, behind-the-scenes)
  - LinkedIn-företagssida (viktigast för B2B!)
- Innehållsidéer för socialt:
  - "Vad ingår i en Home for Us-bostad" (foton + reels)
  - "Mahir möter hyresvärdar" 
  - Konsultcase: "Så bodde Anna när hon jobbade i Linköping"
  - Tidsförlopp av rum-iordningställning
- "Dela-knapp" för hyresvärdar (lockar fler)

### Prio 6 — Affärsmässigt (utanför kod)
- Uppdatera platshållare: telefon 013-XXX XX XX, info@homeforus.se, 
  org.nr 559XXX-XXXX, adressen
- Köpa egen domän: homeforus.se (kostar ~100 kr/år, t.ex. Loopia eller Binero)
- Koppla domänen till Vercel
- Bolagsregistrering (Mahir + Ako)
- Företagsförsäkring
- Bokföringsverktyg (Fortnox eller Bokio)
- Granska hyresavtal-mallar med jurist
- Säkra första hyresvärden (helst via personlig kontakt)
- Lägg upp första riktiga bostäder med bilder

### Förslag på arbetsordning
1. Uppdatera platshållare (5 min — bara klistra in riktig info)
2. Bostadsbild + rumsbilder + hover-statussymboler (1 stor sprint)
3. Bekräftelsemail (Resend — gratis upp till 3000 mail/mån)
4. Admin-roll + byt lösenord (säkerhet före marknadsföring)
5. Open Graph-bilder + analytics
6. Köpa domän och koppla
7. Sociala medier-konton + innehållsplan

### Tidsuppskattning
- Tekniskt (prio 1-5): 2-3 effektiva arbetsdagar med agent
- Affärsmässigt (prio 6): pågående parallellt med Mahir