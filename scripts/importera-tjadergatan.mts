// ─── Engångsimport: Tjädergatan 17 ───────────────────────────────────────────
//
// Lägger upp bostaden Tjädergatan 17 med nio rum och 27 bilder.
//
// KÖRNING (Node 24 kör TypeScript direkt — inget byggsteg):
//   node scripts/importera-tjadergatan.mts "<mapp med bilderna>"            ← torrkörning
//   node scripts/importera-tjadergatan.mts "<mapp med bilderna>" --skarpt   ← på riktigt
//
// Utan --skarpt görs bara en torrkörning: alla kontroller och bildbearbetningen
// körs, men inget laddas upp och inget skrivs till databasen. Okända argument
// stoppar skriptet, så en felstavad flagga kan aldrig ge en skarp körning.
//
// Node skriver en varning "MODULE_TYPELESS_PACKAGE_JSON" för
// lib/bildbehandling.ts. Den är ofarlig och kan ignoreras.
//
// Kräver DATABASE_URL och BLOB_READ_WRITE_TOKEN (läses från .env.local/.env).
//
// I tur och ordning:
//   1. Stoppar om en bostad som heter "Tjädergatan 17" redan finns — då laddas
//      inget upp och inget skapas. Skriptet kan alltså köras igen utan dubbletter.
//   2. Stoppar om databasen saknar kolumnerna Rum.bostadstyp/Rum.sektion
//      (migrationen är inte körd).
//   3. Kontrollerar att alla 27 bildfiler finns. Saknas någon stoppar skriptet
//      och skriver ut vilka.
//   4. Bearbetar varje bild precis som /api/upload (lib/bildbehandling.ts) och
//      laddar upp varje fil EN gång till Vercel Blob, publikt. Gemensamma
//      bilder (köken, badrummen, tvättstugorna) får samma URL i alla rum.
//   5. Skapar bostaden och rummen i en enda databasoperation, i ordningen
//      nedan. Rummen får varsin created_at med en sekunds mellanrum, eftersom
//      sajten visar rummen sorterade på created_at. Misslyckas något efter
//      uppladdningen raderas de uppladdade bilderna igen — men bara om
//      bostaden bevisligen inte sparades.
//   6. Skriver ut alla id:n och adressen till bostadssidan.
//
// Originalfilerna läses bara — de ändras aldrig.

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put, del } from "@vercel/blob";
import { optimeraBild, nyttBildnamn } from "../lib/bildbehandling.ts";
import type { Bostadstyp } from "../lib/bostadstyp.ts";

const PROJEKTROT = path.resolve(import.meta.dirname, "..");
dotenv.config({ path: path.join(PROJEKTROT, ".env.local"), quiet: true });
dotenv.config({ path: path.join(PROJEKTROT, ".env"), quiet: true });

// ─── Uppgifterna ─────────────────────────────────────────────────────────────

const MANADSHYRA = 4900; // samma för alla rum, allt ingår

const BOSTAD = {
  namn: "Tjädergatan 17",
  adress: "Tjädergatan 17",
  stadsdel: null,
  narmaste_hallplats: null,
  bostadstyp: "privat_rum" satisfies Bostadstyp, // filtret går via rummen
  delade_utrymmen: ["Trädgård"],
  inkluderat: ["El", "Varmvatten", "Internet", "Sophämtning"],
  beskrivning:
    "Villa med nio möblerade rum på två våningar och i ett gårdshus. På övre " +
    "våningen finns fem rum som delar två badrum, kök och tvättstuga. På nedre " +
    "våningen finns tre rum med eget badrum, och där delar rummen kök och " +
    "tvättstuga. Gårdshuset är en egen bostad med rum, kökshörna, badrum och " +
    "tvättmaskin. Trädgården är gemensam. Allt ingår i hyran: el, varmvatten, " +
    "internet och sophämtning.",
  // Den första blir omslagsbilden på /bostader
  bilder: ["Villan.jpg", "Framsidan huset.jpg", "Trädgård.jpg"],
};

const OVRE_GEMENSAMT = ["Övre badrum1.jpg", "Övre badrum2.jpg", "Övre köket.jpg", "Övre tvättstuga.jpg"];
const NEDRE_GEMENSAMT = ["Nedre köket.jpg", "Nedre tvättstugan.jpg"];

const OVRE_DELAR = "Delar två badrum, kök och tvättstuga med de andra rummen på övre våningen.";
const NEDRE_DELAR = "Delar kök och tvättstuga med de andra rummen på nedre våningen.";

type Rumsdata = {
  namn: string;
  sektion: string;
  bostadstyp: Bostadstyp;
  beskrivning: string;
  bilder: string[]; // den första blir rummets miniatyrbild
};

// Skapas i exakt den här ordningen — det är ordningen på sajten
const RUM: Rumsdata[] = [
  {
    namn: "Övre · Rum 1",
    sektion: "Övre våningen",
    bostadstyp: "privat_rum",
    beskrivning: `Rymligt rum med öppen spis och fiskbensparkett. ${OVRE_DELAR}`,
    bilder: ["Övre rum1.jpg", "Övre rum1 andra bild.jpg", "Övre rum1 tredje bild.jpg", ...OVRE_GEMENSAMT],
  },
  {
    namn: "Övre · Rum 2",
    sektion: "Övre våningen",
    bostadstyp: "privat_rum",
    beskrivning: `Rum med fiskbensparkett. ${OVRE_DELAR}`,
    bilder: ["Övre rum2.jpg", ...OVRE_GEMENSAMT],
  },
  {
    namn: "Övre · Rum 3",
    sektion: "Övre våningen",
    bostadstyp: "privat_rum",
    beskrivning: `Ljust rum med plats för skrivbord vid fönstret. ${OVRE_DELAR}`,
    bilder: ["Övre rum3.jpg", "Övre rum3 andra bild.jpg", ...OVRE_GEMENSAMT],
  },
  {
    namn: "Övre · Rum 4",
    sektion: "Övre våningen",
    bostadstyp: "privat_rum",
    beskrivning: `Rymligt rum. ${OVRE_DELAR}`,
    bilder: ["Övre rum4.jpg", "Övre rum4 andra bild.jpg", ...OVRE_GEMENSAMT],
  },
  {
    namn: "Övre · Rum 5",
    sektion: "Övre våningen",
    bostadstyp: "privat_rum",
    beskrivning: `Rum med stort fönster. ${OVRE_DELAR}`,
    bilder: ["Övre rum 5.jpg", ...OVRE_GEMENSAMT], // obs: mellanslag i filnamnet
  },
  {
    namn: "Nedre · Rum 1",
    sektion: "Nedre våningen",
    bostadstyp: "rum_eget_bad",
    beskrivning: `Rum med eget badrum med dusch. ${NEDRE_DELAR}`,
    bilder: ["Nedre rum1.jpg", "Nedre badrum rum1.jpg", ...NEDRE_GEMENSAMT],
  },
  {
    namn: "Nedre · Rum 2",
    sektion: "Nedre våningen",
    bostadstyp: "rum_eget_bad",
    beskrivning: `Rum med eget badrum med dusch. ${NEDRE_DELAR}`,
    bilder: ["Nedre rum2.jpg", "Nedre badrum rum2.jpg", ...NEDRE_GEMENSAMT],
  },
  {
    namn: "Nedre · Rum 3",
    sektion: "Nedre våningen",
    bostadstyp: "rum_eget_bad",
    beskrivning: `Rum med eget badrum. ${NEDRE_DELAR} Bilder kommer inom kort.`,
    // Inga bilder: platshållaren visas. De gemensamma bilderna läggs medvetet
    // inte här — då hade köket blivit rummets miniatyrbild.
    bilder: [],
  },
  {
    namn: "Gårdshuset",
    sektion: "Gårdshuset",
    bostadstyp: "hel_lagenhet",
    beskrivning:
      "Egen bostad i gårdshuset, med rum, kökshörna, badrum med dusch och tvättmaskin. Egen ingång.",
    // Rum och kök först — visar bäst att det är en egen bostad
    bilder: [
      "Garaget rum,kök.jpg",
      "Garaget rum.jpg",
      "Garaget badrum.jpg",
      "Garaget tvättstuga.jpg",
      "Garaget utsida.jpg",
    ],
  },
];

const ANTAL_FILER = 27;

// ─── Hjälpare ────────────────────────────────────────────────────────────────

function stopp(meddelande: string): never {
  console.error(`\nSTOPP: ${meddelande}`);
  process.exit(1);
}

function kb(byte: number): string {
  return `${Math.round(byte / 1024)} kB`;
}

// ─── Körning ─────────────────────────────────────────────────────────────────

const argument = process.argv.slice(2);
const flaggor = argument.filter((a) => a.startsWith("-"));
const okanda = flaggor.filter((f) => f !== "--skarpt");
if (okanda.length > 0) {
  stopp(`Okänt argument: ${okanda.join(", ")}. Det enda som finns är --skarpt.`);
}
const torrkorning = !flaggor.includes("--skarpt");
const mappar = argument.filter((a) => !a.startsWith("-"));
if (mappar.length !== 1) {
  stopp('Ange exakt en mapp med bilderna: node scripts/importera-tjadergatan.mts "<mapp>" [--skarpt]');
}
const bildmapp = mappar[0];
if (!fs.existsSync(bildmapp) || !fs.statSync(bildmapp).isDirectory()) {
  stopp(`Hittar ingen mapp: ${bildmapp}`);
}
if (!process.env.DATABASE_URL) stopp("DATABASE_URL saknas (.env.local/.env).");
if (!torrkorning && !process.env.BLOB_READ_WRITE_TOKEN) {
  stopp("BLOB_READ_WRITE_TOKEN saknas (.env.local). Den behövs för att ladda upp bilderna.");
}

const unikaFiler = [...new Set([...BOSTAD.bilder, ...RUM.flatMap((r) => r.bilder)])];
if (unikaFiler.length !== ANTAL_FILER) {
  stopp(`Listorna i skriptet innehåller ${unikaFiler.length} unika filer, väntade ${ANTAL_FILER}.`);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const uppladdade: string[] = [];

try {
  console.log(torrkorning ? "TORRKÖRNING — inget laddas upp och inget skapas.\n" : "SKARP KÖRNING\n");
  console.log(`Databas: ${new URL(process.env.DATABASE_URL!).hostname}`);

  // 1. Finns bostaden redan?
  const befintlig = await prisma.bostad.findFirst({
    where: { namn: { equals: BOSTAD.namn, mode: "insensitive" } },
    select: { id: true, namn: true, created_at: true, _count: { select: { rum: true } } },
  });
  if (befintlig) {
    const text =
      `Det finns redan en bostad som heter "${befintlig.namn}" (id ${befintlig.id}, ` +
      `skapad ${befintlig.created_at.toISOString().slice(0, 10)}, ${befintlig._count.rum} rum). ` +
      "Inget har laddats upp och inget har skapats.";
    if (!torrkorning) stopp(text);
    console.log(`\n[skulle stoppa] ${text}`);
  }

  // 2. Är migrationen körd?
  const kolumner = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Rum' AND column_name IN ('bostadstyp', 'sektion')`;
  if (kolumner.length !== 2) {
    const text =
      "Databasen saknar kolumnerna Rum.bostadstyp och/eller Rum.sektion — kör migrationen först " +
      "(npx prisma migrate deploy).";
    if (!torrkorning) stopp(text);
    console.log(`[skulle stoppa] ${text}`);
  }

  // 3. Finns alla filer? Jämför Unicode-normaliserat (å/ä/ö kan lagras på två sätt)
  const iMappen = new Map(fs.readdirSync(bildmapp).map((f) => [f.normalize("NFC"), f]));
  const saknas = unikaFiler.filter((f) => !iMappen.has(f.normalize("NFC")));
  if (saknas.length > 0) {
    stopp(`${saknas.length} fil(er) saknas i ${bildmapp}:\n  - ${saknas.join("\n  - ")}`);
  }
  console.log(`Alla ${unikaFiler.length} filer finns.\n`);

  // 4a. Bearbeta allt först — ett trasigt original stoppar innan något laddas upp
  const bearbetade = new Map<string, Buffer>();
  for (const fil of unikaFiler) {
    const original = fs.readFileSync(path.join(bildmapp, iMappen.get(fil.normalize("NFC"))!));
    const webp = await optimeraBild(original);
    bearbetade.set(fil, webp);
    console.log(`  bearbetad  ${fil.padEnd(28)} ${kb(original.length).padStart(7)} → ${kb(webp.length).padStart(6)} webp`);
  }

  if (torrkorning) {
    console.log(
      `\nTorrkörningen klar: ${RUM.length} rum, ${unikaFiler.length} bilder. Inget har ändrats. ` +
        "Lägg till --skarpt för att ladda upp och skapa på riktigt."
    );
  } else {
    // 4b. Ladda upp varje fil en gång
    const urlFor = new Map<string, string>();
    console.log("");
    for (const fil of unikaFiler) {
      const blob = await put(nyttBildnamn(), bearbetade.get(fil)!, {
        access: "public",
        contentType: "image/webp",
      });
      uppladdade.push(blob.url);
      urlFor.set(fil, blob.url);
      console.log(`  uppladdad  ${fil.padEnd(28)} ${blob.url}`);
    }
    const urlar = (filer: string[]) => filer.map((f) => urlFor.get(f)!);

    // 5. Bostad + rum i en operation. Rummen sorteras på created_at på sajten,
    //    så de får en sekunds mellanrum i rätt ordning.
    const start = Date.now();
    const bostad = await prisma.bostad.create({
      data: {
        namn: BOSTAD.namn,
        adress: BOSTAD.adress,
        stadsdel: BOSTAD.stadsdel,
        narmaste_hallplats: BOSTAD.narmaste_hallplats,
        bostadstyp: BOSTAD.bostadstyp,
        beskrivning: BOSTAD.beskrivning,
        bilder: urlar(BOSTAD.bilder),
        delade_utrymmen: BOSTAD.delade_utrymmen,
        inkluderat: BOSTAD.inkluderat,
        rum: {
          create: RUM.map((r, i) => ({
            namn: r.namn,
            sektion: r.sektion,
            bostadstyp: r.bostadstyp,
            beskrivning: r.beskrivning,
            bilder: urlar(r.bilder),
            kvm: null,
            manadshyra: MANADSHYRA,
            moblering: [],
            created_at: new Date(start + i * 1000),
          })),
        },
      },
      include: { rum: { orderBy: { created_at: "asc" } } },
    });

    // Kontroll: rummen kommer tillbaka i rätt ordning med rätt antal bilder
    const fel = RUM.flatMap((r, i) => {
      const skapat = bostad.rum[i];
      if (skapat?.namn !== r.namn) return [`plats ${i + 1}: väntade "${r.namn}", fick "${skapat?.namn}"`];
      if (skapat.bilder.length !== r.bilder.length) return [`${r.namn}: ${skapat.bilder.length} bilder, väntade ${r.bilder.length}`];
      return [];
    });
    if (bostad.rum.length !== RUM.length) fel.push(`${bostad.rum.length} rum skapades, väntade ${RUM.length}`);

    console.log(`\nSkapat:`);
    console.log(`  Bostad  ${bostad.id}  ${bostad.namn}`);
    for (const r of bostad.rum) {
      console.log(`  Rum     ${r.id}  ${r.namn.padEnd(14)} ${r.sektion?.padEnd(15)} ${r.bostadstyp.padEnd(13)} ${r.bilder.length} bilder`);
    }
    console.log(`\nBostadssidan: https://reloka.se/bostad/${bostad.id}`);
    if (fel.length > 0) {
      // Bostaden finns nu — bilderna raderas inte, men avvikelsen ska synas
      console.error(`\nVARNING — kontrollen hittade avvikelser:\n  - ${fel.join("\n  - ")}`);
      process.exitCode = 1;
    }
    uppladdade.length = 0; // allt är kopplat till bostaden nu
  }
} catch (err) {
  console.error("\nFEL:", err instanceof Error ? err.message : err);
  if (uppladdade.length > 0) {
    // Bostaden kan ha sparats trots felet, t.ex. om anslutningen bröts precis
    // när databasen bekräftade. Då pekar den på bilderna och de får inte
    // raderas. Steg 1 visade att ingen bostad med namnet fanns när vi började,
    // så finns en nu har den här körningen skapat den.
    let skapad: { id: string } | null | undefined;
    try {
      skapad = await prisma.bostad.findFirst({
        where: { namn: { equals: BOSTAD.namn, mode: "insensitive" } },
        select: { id: true },
      });
    } catch {
      skapad = undefined; // okänt läge — gissa inte
    }
    if (skapad === null) {
      console.error(`Bostaden skapades inte. Raderar de ${uppladdade.length} bilder som hann laddas upp ...`);
      try {
        await del(uppladdade);
        console.error("De är raderade. Inget finns kvar från den här körningen.");
      } catch (delFel) {
        console.error("Kunde inte radera dem — ta bort dessa manuellt i Vercel Blob:");
        for (const u of uppladdade) console.error(`  ${u}`);
        console.error(delFel);
      }
    } else {
      console.error(
        skapad
          ? `Bostaden skapades ändå (id ${skapad.id}) — bilderna behålls. Kontrollera https://reloka.se/bostad/${skapad.id}.`
          : "Kunde inte kontrollera om bostaden skapades — bilderna behålls. Kontrollera databasen innan något raderas."
      );
      console.error("Uppladdade bilder:");
      for (const u of uppladdade) console.error(`  ${u}`);
    }
  }
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
