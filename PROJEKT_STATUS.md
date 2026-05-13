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

### Förslag på nästa steg
- Bilduppladdning för bostäder och rum (Cloudinary eller Vercel Blob)
- Bekräftelsemail vid bokning (Resend eller liknande)
- Bildgalleri svepbart på mobil + pilar på dator
- Avtalstyper i bokningsflödet (medlemskap, standard, premium)
- Egen domän + publicering live