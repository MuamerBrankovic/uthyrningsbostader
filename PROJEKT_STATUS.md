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
