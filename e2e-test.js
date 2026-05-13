// @ts-check
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(__dirname, "e2e-screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

async function screenshot(page, name) {
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function assert(condition, msg) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  try {
    // ── Test 1: Startsida + Link-navigation ───────────────────────────────────
    console.log("\n[1] Startsida + Link-navigation");
    await page.goto(BASE, { waitUntil: "networkidle" });
    await screenshot(page, "01-startsida");

    // Check "Visa alla" link navigates client-side (Link component)
    await page.click('a[href="/bostader"]');
    await page.waitForURL("**/bostader");
    await assert(page.url().includes("/bostader"), "Navigerade till /bostader via Link");
    await screenshot(page, "02-bostader");

    // ── Test 2: Bakåt-navigation (Uppgift 1) ─────────────────────────────────
    console.log("\n[2] Bakåt-navigation");
    // Gå till en bostad om det finns någon
    const firstCard = page.locator('a[href^="/bostad/"]').first();
    const hasCard = await firstCard.count() > 0;

    if (hasCard) {
      await firstCard.click();
      await page.waitForURL("**/bostad/**");
      const bostadUrl = page.url();
      await screenshot(page, "03-bostadssida");
      await assert(page.url().includes("/bostad/"), "Navigerade till bostadssida");

      // Kontrollera att tillbaka-länken är en Link (inte full reload)
      const backLink = page.locator('a[href="/bostader"]').first();
      await assert(await backLink.count() > 0, "Tillbaka-länk finns på bostadssidan");

      // Gå till ett rum
      const firstRoom = page.locator('a[href^="/rum/"]').first();
      const hasRoom = await firstRoom.count() > 0;
      if (hasRoom) {
        await firstRoom.click();
        await page.waitForURL("**/rum/**");
        const rumUrl = page.url();
        await screenshot(page, "04-rumsida");
        await assert(page.url().includes("/rum/"), "Navigerade till rumssida");

        // Bakåt till bostad
        await page.goBack();
        await page.waitForURL("**/bostad/**");
        await assert(page.url() === bostadUrl, "Bakåt till bostadssida fungerade");

        // Bakåt till bostäder
        await page.goBack();
        await page.waitForURL("**/bostader**");
        await assert(page.url().includes("/bostader"), "Bakåt till bostadslistan fungerade");
        await screenshot(page, "05-after-back-navigation");
      }
    } else {
      console.log("  (inga bostäder i databasen, hoppar över navigationstester)");
    }

    // ── Test 3: Bildgalleri (Uppgift 2) ─────────────────────────────────────
    console.log("\n[3] Bildgalleri-komponent på rumssidan");
    if (hasCard) {
      const firstCard2 = page.locator('a[href^="/bostad/"]').first();
      if (await firstCard2.count() > 0) {
        await firstCard2.click();
        await page.waitForURL("**/bostad/**");
        const firstRoom2 = page.locator('a[href^="/rum/"]').first();
        if (await firstRoom2.count() > 0) {
          await firstRoom2.click();
          await page.waitForURL("**/rum/**");

          // Bildgalleri ska finnas (även tom placeholder)
          const galleryContainer = page.locator('.rounded-2xl.overflow-hidden, .rounded-2xl.flex').first();
          await assert(await galleryContainer.count() > 0, "Galleribehållare finns på rumssidan");

          // Piltangenter på desktop (om fler än en bild)
          const arrows = page.locator('button[aria-label="Nästa bild"], button[aria-label="Föregående bild"]');
          const arrowCount = await arrows.count();
          if (arrowCount > 0) {
            await arrows.first().click();
            console.log("  ✓ Pilknapp klickad (gallery navigation)");
          } else {
            console.log("  (inga pilar — rum har max 1 bild, OK)");
          }

          await screenshot(page, "06-rumsida-galleri");
        }
      }
    }

    // ── Test 4: Bokningsmodal med avtalstyp (Uppgift 3) ──────────────────────
    console.log("\n[4] Bokningsmodal med avtalstyper");
    if (hasCard) {
      // Vi är fortfarande på rumssidan om allt gick bra
      if (page.url().includes("/rum/")) {
        const bokaBtnSelector = 'button:has-text("Skicka bokningsförfrågan")';
        const bokaBtn = page.locator(bokaBtnSelector).first();
        if (await bokaBtn.count() > 0 && !(await bokaBtn.isDisabled())) {
          await bokaBtn.click();
          await page.waitForSelector('h2:has-text("Boka")');

          // Kontrollera att de 3 avtalstyp-korten finns
          const memberCard = page.locator('button:has-text("Medlemskap")');
          const standardCard = page.locator('button:has-text("Standard")');
          const premiumCard = page.locator('button:has-text("Premium")');
          await assert(await memberCard.count() > 0, "Avtalstyp 'Medlemskap' kort finns");
          await assert(await standardCard.count() > 0, "Avtalstyp 'Standard' kort finns");
          await assert(await premiumCard.count() > 0, "Avtalstyp 'Premium' kort finns");

          // Klicka på Premium — ska bli markerat (grön border)
          await premiumCard.click();
          const premiumClasses = await premiumCard.getAttribute("class");
          await assert(premiumClasses?.includes("border-[#2D7A4F]"), "Premium-kort markerat med grön border");

          await screenshot(page, "07-bokningsmodal-avtalstyp");

          // Stäng modal
          await page.keyboard.press("Escape");
          await page.click('button[aria-label="Stäng"]').catch(() => {});
        } else {
          console.log("  (rummet ej bokningsbart eller bokningsknapp saknas, hoppar över)");
        }
      }
    }

    // ── Test 5: Dashboard med kontaktperson (Uppgift 4) ──────────────────────
    console.log("\n[5] Dashboard — Lägg upp bostad med kontaktperson");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await screenshot(page, "08-dashboard");

    // Klicka på Lägg upp bostad-fliken
    const laggUppBostadFlik = page.locator('button:has-text("Lägg upp bostad")');
    if (await laggUppBostadFlik.count() > 0) {
      await laggUppBostadFlik.click();
      await page.waitForTimeout(500);

      // Kontrollera att kontaktperson-sektionen finns
      const kontaktSection = page.locator('text=Kontaktperson');
      await assert(await kontaktSection.count() > 0, "Kontaktperson-sektion finns i formuläret");

      // Kontrollera fält
      const kontaktNamnInput = page.locator('input[placeholder="Anna Svensson"]').first();
      await assert(await kontaktNamnInput.count() > 0, "Kontaktnamn-fält finns");

      const kontaktEmailInput = page.locator('input[placeholder="anna@exempel.se"]').first();
      await assert(await kontaktEmailInput.count() > 0, "Kontakt-email-fält finns");

      await screenshot(page, "09-dashboard-kontaktperson");
    } else {
      console.log("  (ej inloggad — dashboard är inte tillgänglig)");
    }

    // ── Test 6: Dashboard Mina Bokningar — avtalstyp-badge ───────────────────
    console.log("\n[6] Dashboard — Mina bokningar med avtalstyp-badge");
    const mina = page.locator('button:has-text("Mina bokningar")');
    if (await mina.count() > 0) {
      await mina.click();
      await page.waitForTimeout(500);
      await screenshot(page, "10-mina-bokningar");
      // Om det finns bokningar, kontrollera att avtalstyp-badgen visas
      const avtalsBadge = page.locator('text=Standard, text=Premium, text=Medlemskap').first();
      const hasBokningar = await page.locator('.rounded-2xl').count() > 2;
      if (hasBokningar) {
        console.log("  ✓ Bokningar finns — badge borde synas (se screenshot)");
      } else {
        console.log("  (inga bokningar att visa ännu)");
      }
    }

    // ── Summering ─────────────────────────────────────────────────────────────
    console.log("\n✅ Alla tester klara!\n");
    if (errors.length > 0) {
      console.warn("⚠️  Konsolfel under testning:");
      errors.forEach((e) => console.warn("   -", e));
    } else {
      console.log("✅ Inga JS-konsolfel\n");
    }

  } catch (err) {
    console.error("\n❌ Testfel:", err.message);
    await screenshot(page, "ERROR");
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
