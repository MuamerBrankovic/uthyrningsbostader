# Deploy-guide — UthyrningsBostäder

> Senast uppdaterad: 2026-04-22  
> Stack: Next.js 16 · Supabase · Tailwind CSS · Vercel

---

## Steg 1 — Committa allt lokalt

Öppna terminalen i projektroten och kör:

```bash
git add app/ lib/ types/ public/ PROJEKT_STATUS.md package.json package-lock.json
git commit -m "feat: complete MVP with auth, listings, bookings, RLS and navbar"
```

Kontrollera att .env.local INTE är med:

```bash
git status
# .env.local ska inte synas i "Changes to be committed"
```

---

## Steg 2 — Skapa GitHub-repo och pusha

### Alternativ A — med GitHub CLI (om `gh` är installerat)

```bash
gh repo create uthyrningsbostader --private --source=. --remote=origin --push
```

Klart — repot skapas och koden pushas i ett kommando.

### Alternativ B — via webbgränssnittet

1. Gå till [github.com/new](https://github.com/new)
2. Fyll i:
   - **Repository name:** `uthyrningsbostader`
   - **Visibility:** Private (rekommenderas)
   - **Initialize repository:** NEJ (lämna alla checkboxar tomma)
3. Klicka **Create repository**
4. Kör sedan i terminalen:

```bash
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/uthyrningsbostader.git
git push -u origin main
```

---

## Steg 3 — Importera till Vercel

1. Gå till [vercel.com](https://vercel.com) och logga in
2. Klicka **Add New → Project**
3. Klicka **Import** bredvid ditt `uthyrningsbostader`-repo
   - Om repot inte syns: klicka "Adjust GitHub App Permissions" och ge Vercel åtkomst
4. Lämna alla build-inställningar på default:
   - **Framework Preset:** Next.js (detekteras automatiskt)
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

---

## Steg 4 — Environment Variables (KRITISKT — innan deploy)

**Klicka inte Deploy ännu.** Lägg till environment variables först.

I Vercel-projektets inställningspanel (visas under import-flödet):

1. Klicka **Environment Variables**
2. Lägg till dessa två variabler — kopiera värdena från din lokala `.env.local`:

| Variable name | Environments |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Production ✅ Preview ✅ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Production ✅ Preview ✅ Development |

> Öppna `.env.local` lokalt, kopiera värdet efter `=` för varje rad.  
> Sätt båda variablerna på **alla tre environments** (Production, Preview, Development).

---

## Steg 5 — Deploy

1. Klicka **Deploy**
2. Vercel bygger projektet (~1–2 minuter)
3. Vid lyckad deploy ser du:
   - Grön bock och texten **"Congratulations!"**
   - En live-URL i formatet: `uthyrningsbostader.vercel.app` (eller liknande)

Klicka på URL:en för att öppna sidan live.

---

## Steg 6 — Supabase URL-konfiguration (KRITISKT — annars bryts login)

Supabase skickar auth-redirects (efter registrering/lösenordsåterställning) till en godkänd URL. Utan detta steg hamnar användaren på `localhost:3000` efter att ha klickat en bekräftelselänk i produktionsmiljön.

1. Logga in på [supabase.com](https://supabase.com) → välj ditt projekt
2. Gå till **Authentication → URL Configuration**
3. Uppdatera:

| Fält | Värde |
|---|---|
| **Site URL** | `https://uthyrningsbostader.vercel.app` |
| **Redirect URLs** | `https://uthyrningsbostader.vercel.app/**` |

> Ersätt `uthyrningsbostader.vercel.app` med din faktiska Vercel-URL.  
> `/**` i slutet täcker alla undersidor (t.ex. `/dashboard`, `/logga-in`).

4. Klicka **Save**

---

## Steg 7 — Testplan på live-URL:en

Testa dessa flöden i ordning efter deploy:

| # | Flöde | Förväntat resultat |
|---|---|---|
| 1 | Öppna startsidan | Laddas, navbar syns |
| 2 | Gå till `/bostader` | Bostäder hämtas från Supabase |
| 3 | Sök på stad i sökfältet på startsidan | Omdirigeras till `/bostader?city=...` med filter förifyllt |
| 4 | Registrera ett nytt konto | Bekräftelsemail skickas, konto skapas |
| 5 | Logga in | Dashboard-länk syns i navbar |
| 6 | Lägg upp en bostad via Dashboard | Bostaden dyker upp i `/bostader` |
| 7 | Gör en bokning som inloggad | Bokningsbekräftelse visas |
| 8 | Kolla `/dashboard` → Mina bokningar | Bokningen syns |
| 9 | Verifiera i Supabase Table Editor | `owner_id` och `user_id` är satta på nya rader |
| 10 | Logga ut | Navbar visar Logga in / Registrera igen |

---

## Framtida deploys

Varje gång du pushar till `main` på GitHub triggas en automatisk deploy på Vercel.  
Du behöver inte göra något manuellt — Vercel lyssnar på `git push`.
