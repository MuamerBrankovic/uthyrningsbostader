# Backup av ReLokas databas

En enkel rutin för att säkerhetskopiera databasen. Skriven så att du ska
kunna följa den även om du inte är van vid terminalen.

## Varför det här behövs

All viktig information — bokningar, offertförfrågningar, hyresvärdsanmälningar,
användarkonton och snart riktiga kunders kontraktuppgifter — ligger i vår
databas hos **Neon**. På Neons gratisplan är fönstret för att återställa gammal
data kort (ungefär en vecka bakåt). Så fort vi har riktiga betalande kunder
vill vi inte vara beroende av det. En egen kopia som vi själva sparar gör att
vi alltid kan återställa, även om något går allvarligt fel.

Det finns två skyddsnät, och vi använder gärna båda:

1. **Neon-branch (snabbast, inbyggt)** — en ögonblicksbild direkt i Neon.
2. **Egen dump-fil (tryggast, ligger utanför Neon)** — en fil vi sparar själva.

---

## Skyddsnät 1: Neon-branch (tar 30 sekunder)

Detta är det enklaste. En "branch" i Neon är en exakt kopia av databasen som
den ser ut just nu — som en fotografering av allt innehåll.

1. Logga in på [neon.tech](https://neon.tech) och öppna vårt projekt.
2. Gå till **Branches** i menyn.
3. Klicka **New branch**, döp den till t.ex. `backup-2026-07-30` (dagens datum).
4. Klart. Om något går fel senare kan vi återgå till den här kopian.

Gör detta **innan** varje större ändring (t.ex. innan en ny version läggs ut
som ändrar databasen). Det kostar inget och går på sekunder.

Begränsning: branchar ligger kvar inne i Neon. Om hela Neon-kontot skulle
försvinna finns de inte kvar. Därför har vi även skyddsnät 2.

---

## Skyddsnät 2: Egen dump-fil (kör varje vecka)

Här tar vi ut hela databasen som en enda fil och sparar den på ett säkert
ställe utanför datorn.

### Engångsförberedelse

Du behöver programmet **pg_dump** (ingår i PostgreSQL). Installera en gång:

- **Windows:** ladda ner "PostgreSQL" från
  [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
  Under installationen räcker det att bocka i **Command Line Tools**.
- Kontrollera att det fungerar genom att skriva `pg_dump --version` i
  terminalen. Kommer det upp ett versionsnummer är allt klart.

### Hitta anslutningssträngen (DATABASE_URL)

Det här är "adressen och nyckeln" till databasen. Den finns på två ställen:

- I filen `.env.local` i projektet, på raden som börjar med `DATABASE_URL=`.
- Eller i Vercel: **Settings → Environment Variables → DATABASE_URL**.

Den ser ut ungefär så här (en enda lång rad):

```
postgresql://användare:lösenord@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

⚠️ Den innehåller ett lösenord — dela den aldrig och lägg aldrig upp den
någonstans publikt.

### Ta backupen

Öppna terminalen och kör detta (byt ut hela strängen inom citattecken mot vår
riktiga DATABASE_URL, och byt datumet i filnamnet):

```bash
pg_dump "postgresql://användare:lösenord@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require" > reloka-backup-2026-07-30.sql
```

Förklaring i vardagsspråk:
- `pg_dump` = programmet som packar ihop databasen.
- Texten inom `"..."` = vår anslutningssträng (DATABASE_URL).
- `>` = "spara resultatet i en fil".
- `reloka-backup-2026-07-30.sql` = filen som skapas. Använd alltid dagens datum
  i namnet så vi ser vilken som är nyast.

När kommandot är klart (kan ta någon minut) ligger filen i mappen där du står i
terminalen. Det är hela databasen i en fil.

### Var och hur ofta

- **Hur ofta:** en gång i veckan. Sätt gärna en påminnelse, t.ex. varje måndag.
  Ta även en extra backup före större ändringar.
- **Var:** ladda upp filen till **Google Drive** (eller motsvarande) i en mapp
  som heter t.ex. "ReLoka databasbackup". Poängen är att den ligger **utanför
  din dator** — om datorn går sönder finns kopian kvar.
- **Behåll** de senaste ~8 veckorna. Äldre kan raderas.

---

## Så återställer du om något går fel

Om databasen skadats eller data försvunnit:

1. **Enklast:** om du har en Neon-branch från innan felet — gå till Neon →
   Branches och återställ från den. Kontakta gärna någon van vid detta först,
   så inget skrivs över av misstag.

2. **Från dump-filen:** skapa först en **ny, tom databas** (t.ex. en ny Neon-branch)
   och läs in filen i den — läs aldrig in en gammal backup rakt ovanpå den
   databas som används live, då kan nyare data skrivas över. Kommandot:

   ```bash
   psql "postgresql://...NYA_tomma_databasen..." < reloka-backup-2026-07-30.sql
   ```

   När den nya databasen ser rätt ut pekar man om appen (DATABASE_URL i Vercel)
   till den. Gör detta lugnt, helst tillsammans med någon — det är sällan bråttom
   nog att chansa.

---

## Viktigt: bilder och kontrakt-PDF:er ingår INTE i databasbackupen

Databasdumpen innehåller **texten och uppgifterna** — men inte de **filer** som
laddats upp. Uppladdade bostadsbilder och kontrakt-PDF:er ligger i **Vercel Blob**,
inte i databasen. I databasen finns bara länkarna till dem.

Det betyder: om en fil i Vercel Blob raderas hjälper inte databasbackupen — länken
finns kvar men filen är borta.

Så säkrar vi filerna separat:
- Kontrakt-PDF:er: spara alltid en egen kopia av varje undertecknat kontrakt i
  vår egen mapp (t.ex. Google Drive) när det är klart. Lita inte på att den bara
  finns i Vercel Blob.
- Bostadsbilder: behåll originalbilderna i en egen mapp så de kan laddas upp igen
  vid behov.

Kort sagt: **databasbackup = texten och uppgifterna. Filkopiorna sköter vi
för hand vid sidan om.**
