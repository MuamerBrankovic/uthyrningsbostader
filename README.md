# UthyrningsBostäder — Home for Us

Plattform för uthyrning av rum i kollektivboenden. Kopplar ihop uthyrare och hyresgäster med möblerade bostäder i hela Sverige.

## Tech stack

- **Next.js 16** (App Router)
- **React 19**
- **Prisma 7** + **Neon PostgreSQL**
- **Tailwind CSS 4**
- **JWT-autentisering** via `jose` + `bcryptjs`
- **Bilduppladdning** via Vercel Blob (med lokal fallback under utveckling)

## Kom igång lokalt

```bash
# 1. Installera beroenden
npm install

# 2. Skapa .env.local med miljövariabler (se nedan)

# 3. Generera Prisma-klient
npx prisma generate

# 4. Kör migrationer mot databasen
npx prisma migrate deploy

# 5. Starta dev-server
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.

## Miljövariabler

Skapa en fil `.env.local` i projektroten med följande variabler:

```env
# PostgreSQL-anslutning (från Neon eller annan PostgreSQL-provider)
DATABASE_URL="postgresql://..."

# Hemlig nyckel för JWT-tokens — måste vara lång och slumpmässig i produktion
JWT_SECRET="din-hemliga-nyckel-minst-32-tecken"

# Valfritt: Vercel Blob-token för bilduppladdning i produktion
# Lämna tom för att använda lokal fallback (/public/uploads/) under utveckling
BLOB_READ_WRITE_TOKEN=""
```

### Generera ett starkt JWT_SECRET

Kör i terminalen:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Bygga för produktion

```bash
npm run build   # kör prisma generate + next build automatiskt
npm start
```

## Bilduppladdning

- **Lokalt**: Bilder sparas i `/public/uploads/` (ignoreras av git)
- **Produktion (Vercel)**: Bilder laddas upp till Vercel Blob när `BLOB_READ_WRITE_TOKEN` är satt

## Projektstruktur

```
app/
  api/          API-routes (auth, bostäder, rum, bokningar, upload)
  components/   Delade komponenter (Navbar, Bildgalleri)
  bostad/[id]/  Bostadssida med bildgalleri
  bostader/     Bostadslistan med filter
  rum/[id]/     Rumssida med bokningsformulär och kontaktperson
  dashboard/    Inloggad vy (lägg upp bostad/rum, mina bokningar)
  logga-in/
  registrera/
lib/
  auth.ts       JWT-sessionshantering
  prisma.ts     Prisma-klient (singleton)
  datum.ts      Datumformatering
prisma/
  schema.prisma Databasschema (Bostad, Rum, Bokning, Anvandare)
  migrations/   Migreringshistorik
```
