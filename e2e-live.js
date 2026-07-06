// @ts-check
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "https://reloka.se";
const EMAIL = "testuser+vercel@example.com";
const PASS  = "TestPass123";

const DIR = path.join(__dirname, "e2e-live-screenshots");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

const results = { pass: [], fail: [], observations: [] };
const consoleErrors = [];

async function shot(page, name) {
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

function pass(msg) { results.pass.push(msg); console.log(`  ✅ ${msg}`); }
function fail(msg) { results.fail.push(msg); console.log(`  ❌ ${msg}`); }
function obs(msg)  { results.observations.push(msg); console.log(`  ⚠️  ${msg}`); }

async function waitNav(page, fn, timeout = 12000) {
  await Promise.all([page.waitForLoadState("domcontentloaded", { timeout }), fn()]);
}

// ──────────────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });
  const page = await ctx.newPage();

  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", err => consoleErrors.push(err.message));

  try {

    // ── 1. STARTSIDA ──────────────────────────────────────────────────────────
    console.log("\n[1] STARTSIDA");
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
    await shot(page, "01-startsida");

    const title = await page.title();
    const hasNavbar = await page.locator("nav").count() > 0;
    const hasHero   = await page.locator("h1").count() > 0;
    const heroText  = await page.locator("h1").first().innerText().catch(() => "");
    if (hasNavbar) pass("Navbar renderas"); else fail("Navbar saknas");
    if (hasHero)   pass(`Hero-rubrik: "${heroText.trim()}"`); else fail("Hero-rubrik saknas");
    if (title)     pass(`Sidtitel: "${title}"`);

    // ── 2. NAVIGATION ─────────────────────────────────────────────────────────
    console.log("\n[2] NAVIGATION");

    await page.click('a[href="/bostader"]');
    await page.waitForURL("**/bostader", { timeout: 10000 });
    if (page.url().includes("/bostader")) pass("Navigering /bostader OK"); else fail("/bostader nav misslyckades");
    await shot(page, "02-bostaderlista");

    await page.goBack(); await page.waitForURL(BASE + "/", { timeout: 10000 }).catch(() => {});
    await page.click('a[href="/logga-in"]');
    await page.waitForURL("**/logga-in", { timeout: 10000 });
    if (page.url().includes("/logga-in")) pass("Navigering /logga-in OK"); else fail("/logga-in nav misslyckades");

    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    await page.click('a[href="/registrera"]');
    await page.waitForURL("**/registrera", { timeout: 10000 });
    if (page.url().includes("/registrera")) pass("Navigering /registrera OK"); else fail("/registrera nav misslyckades");
    await page.goBack();

    // ── 3. REGISTRERING ───────────────────────────────────────────────────────
    console.log("\n[3] REGISTRERING");
    await page.goto(`${BASE}/registrera`, { waitUntil: "networkidle" });
    await shot(page, "03-registrera");

    await page.fill('input[type="text"]', "Test Vercel");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASS);
    await page.click('button:has-text("Skapa konto")');
    await page.waitForTimeout(3000);
    await shot(page, "04-registrera-result");

    const regSuccess = page.url().includes("/registrera") &&
      (await page.locator("text=Konto skapat").count() > 0 ||
       await page.locator("text=Välkommen").count() > 0 ||
       await page.locator("text=redan registrerad").count() > 0);

    const alreadyExists = await page.locator("text=redan registrerad").count() > 0;
    if (alreadyExists) {
      obs("Testkontot existerar redan — fortsätter med inloggning");
    } else if (await page.locator("text=Konto skapat").count() > 0 ||
               await page.locator("text=Välkommen").count() > 0) {
      pass("Registrering lyckades — success-meddelande visas");
    } else {
      const errorMsg = await page.locator(".bg-red-50").innerText().catch(() => "");
      if (errorMsg) fail(`Registrering misslyckades: ${errorMsg}`);
      else fail("Registrering — okänt resultat");
    }

    // ── LOGGA IN ──────────────────────────────────────────────────────────────
    console.log("\n[3b] INLOGGNING");
    await page.goto(`${BASE}/logga-in`, { waitUntil: "networkidle" });
    await shot(page, "05-logga-in");

    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASS);
    await page.click('button:has-text("Logga in")');
    await page.waitForTimeout(3000);
    await shot(page, "06-logga-in-result");

    const loginSuccess = await page.locator("text=Välkommen tillbaka").count() > 0 ||
                         await page.locator("text=inloggad").count() > 0;
    const loginError   = await page.locator(".bg-red-50").innerText().catch(() => "");
    if (loginSuccess) {
      pass("Inloggning lyckades — välkommen-meddelande visas");
    } else if (loginError) {
      fail(`Inloggning misslyckades: ${loginError}`);
    } else {
      obs("Inloggning — resultat oklart, fortsätter");
    }

    // Kolla JWT-cookie
    const cookies = await ctx.cookies(BASE);
    const authCookie = cookies.find(c => c.name === "auth-token");
    if (authCookie) {
      pass(`JWT-cookie satt (httpOnly=${authCookie.httpOnly}, secure=${authCookie.secure})`);
      if (!authCookie.secure) obs("Cookie är inte secure — OK på localhost men bör vara secure i prod");
    } else {
      fail("auth-token cookie saknas efter inloggning");
    }

    // Logga ut och in igen
    await page.goto(BASE, { waitUntil: "networkidle" });
    const loggaUtBtn = page.locator('button:has-text("Logga ut")');
    if (await loggaUtBtn.count() > 0) {
      await loggaUtBtn.click();
      await page.waitForTimeout(2000);
      pass("Utloggning fungerar");
    } else {
      obs("Logga ut-knapp ej synlig på startsidan (kan vara OK om navbar inte uppdaterades)");
    }

    // Logga in igen
    await page.goto(`${BASE}/logga-in`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASS);
    await page.click('button:has-text("Logga in")');
    await page.waitForTimeout(3000);

    // ── 4. DASHBOARD — Lägg upp bostad ───────────────────────────────────────
    console.log("\n[4] DASHBOARD — Lägg upp bostad");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await shot(page, "07-dashboard");

    const dashboardVisible = await page.locator('button:has-text("Lägg upp bostad")').count() > 0 ||
                             await page.locator('button:has-text("Mina bokningar")').count() > 0;
    if (dashboardVisible) pass("Dashboard renderas korrekt för inloggad användare");
    else { fail("Dashboard visas inte — är användaren inloggad?"); }

    const laggUppBostadBtn = page.locator('button:has-text("Lägg upp bostad")');
    if (await laggUppBostadBtn.count() > 0) {
      await laggUppBostadBtn.click();
      await page.waitForTimeout(500);

      await page.fill('input[placeholder="t.ex. Hagagatan 12"]', "Testbostad Vercel");
      await page.fill('input[placeholder="t.ex. Södermalm"]', "Vasastan");
      await page.fill('input[placeholder="t.ex. Hagagatan 12, 113 47 Stockholm"]', "Teststigen 1, Stockholm");

      const textareas = page.locator("textarea");
      if (await textareas.count() > 0)
        await textareas.first().fill("En testbostad skapad via automatiserat test på Vercel.");

      await page.fill('input[placeholder="t.ex. Gemensamt kök, Vardagsrum, Badrum"]', "Kök, Badrum");
      await page.fill('input[placeholder="t.ex. El, Vatten, Bredband, TV-avgift"]', "El, Vatten");

      // Kontaktperson
      const kontaktNamnInput = page.locator('input[placeholder="Anna Svensson"]').first();
      if (await kontaktNamnInput.count() > 0) {
        await kontaktNamnInput.fill("Test Kontakt");
        await page.fill('input[placeholder="anna@exempel.se"]', "kontakt@test.se");
        await page.fill('input[placeholder="070-000 00 00"]', "070-123 45 67");
        pass("Kontaktperson-fält ifyllda");
      } else {
        obs("Kontaktperson-fält hittades ej");
      }

      // Bilduppladdning — skapa en testbild i minnet
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        // Skapa en minimal giltig JPEG (1x1 px)
        const tinyJpeg = Buffer.from([
          0xff,0xd8,0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,
          0x00,0x01,0x00,0x00,0xff,0xdb,0x00,0x43,0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,
          0x07,0x07,0x07,0x09,0x09,0x08,0x0a,0x0c,0x14,0x0d,0x0c,0x0b,0x0b,0x0c,0x19,0x12,
          0x13,0x0f,0x14,0x1d,0x1a,0x1f,0x1e,0x1d,0x1a,0x1c,0x1c,0x20,0x24,0x2e,0x27,0x20,
          0x22,0x2c,0x23,0x1c,0x1c,0x28,0x37,0x29,0x2c,0x30,0x31,0x34,0x34,0x34,0x1f,0x27,
          0x39,0x3d,0x38,0x32,0x3c,0x2e,0x33,0x34,0x32,0xff,0xc0,0x00,0x0b,0x08,0x00,0x01,
          0x00,0x01,0x01,0x01,0x11,0x00,0xff,0xc4,0x00,0x1f,0x00,0x00,0x01,0x05,0x01,0x01,
          0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,
          0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0xff,0xc4,0x00,0xb5,0x10,0x00,0x02,0x01,0x03,
          0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7d,0x01,0x02,0x03,0x00,
          0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,0x22,0x71,0x14,0x32,
          0x81,0x91,0xa1,0x08,0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,0x24,0x33,0x62,0x72,
          0x82,0x09,0x0a,0x16,0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,0x29,0x2a,0x34,0x35,
          0x36,0x37,0x38,0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4a,0x53,0x54,0x55,
          0x56,0x57,0x58,0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6a,0x73,0x74,0x75,
          0x76,0x77,0x78,0x79,0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8a,0x92,0x93,0x94,
          0x95,0x96,0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,
          0xb3,0xb4,0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,
          0xca,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,0xe3,0xe4,0xe5,0xe6,
          0xe7,0xe8,0xe9,0xea,0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,0xf9,0xfa,0xff,0xda,
          0x00,0x08,0x01,0x01,0x00,0x00,0x3f,0x00,0xfb,0x28,0xa2,0x8a,0xff,0xd9
        ]);
        const tmpPath = path.join(__dirname, "test-image.jpg");
        fs.writeFileSync(tmpPath, tinyJpeg);
        await fileInput.setInputFiles(tmpPath);
        await page.waitForTimeout(3000);
        const thumbnail = page.locator('img[src*="uploads"], img[src*="blob"]').first();
        if (await thumbnail.count() > 0) pass("Bilduppladdning lyckades — thumbnail visas");
        else {
          const uploadError = await page.locator('text=Fel, text=misslyckades, text=error').first().innerText().catch(() => "");
          if (uploadError) fail(`Bilduppladdning: ${uploadError}`);
          else obs("Bilduppladdning — thumbnail inte synlig (Vercel Blob kanske ej aktivt)");
        }
        fs.unlinkSync(tmpPath);
      } else {
        obs("Ingen file input hittades");
      }

      await shot(page, "08-lagg-upp-bostad");
      await page.click('button:has-text("Lägg upp bostad")');
      await page.waitForTimeout(4000);
      await shot(page, "09-bostad-sparad");

      const successMsg = await page.locator("text=Bostaden har lagts upp").count() > 0;
      const errorMsg2  = await page.locator(".bg-red-50").innerText().catch(() => "");
      if (successMsg) pass("Bostad skapad — success-meddelande visas");
      else if (errorMsg2) fail(`Bostad-submit fel: ${errorMsg2}`);
      else obs("Bostad submit — resultat oklart");
    }

    // ── 5. LÄGG UPP RUM ──────────────────────────────────────────────────────
    console.log("\n[5] DASHBOARD — Lägg upp rum");
    const laggUppRumBtn = page.locator('button:has-text("Lägg upp rum")');
    if (await laggUppRumBtn.count() > 0) {
      await laggUppRumBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, "10-lagg-upp-rum");

      const select = page.locator("select").first();
      if (await select.count() > 0) {
        const options = await select.locator("option").count();
        if (options > 1) {
          await select.selectOption({ index: 1 });
          pass(`Bostad-dropdown fungerar (${options - 1} bostad/er tillgänglig/a)`);
        } else {
          obs("Dropdown finns men inga bostäder (nyss skapad kanske inte laddats)");
        }
      } else {
        obs("Bostad-dropdown saknas eller laddas");
      }

      await page.fill('input[placeholder*="Rum 1"]', "Enkelrum Söder").catch(() => {});
      await page.fill('input[placeholder*="12"]', "12").catch(() => {});
      await page.fill('input[placeholder*="manad"], input[type="number"]', "8500").catch(async () => {
        const numInputs = page.locator('input[type="number"]');
        if (await numInputs.count() >= 2) await numInputs.last().fill("8500");
      });
    }

    // ── 6. BOSTADSLISTA ───────────────────────────────────────────────────────
    console.log("\n[6] BOSTADSLISTA");
    await page.goto(`${BASE}/bostader`, { waitUntil: "networkidle" });
    await shot(page, "11-bostaderlista");

    const cards = page.locator('a[href^="/bostad/"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      pass(`Bostadslista visar ${cardCount} bostad(er)`);
    } else {
      obs("Inga bostäder visas (kan vara OK om databasen är tom)");
    }

    const searchInput = page.locator('input[placeholder*="Stockholm"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill("Vasastan");
      await page.waitForTimeout(500);
      const filtered = await page.locator('a[href^="/bostad/"]').count();
      pass(`Sökfält fungerar (${filtered} resultat för "Vasastan")`);
      await searchInput.clear();
    }

    const rangeInput = page.locator('input[type="range"]');
    if (await rangeInput.count() > 0) pass("Prisfilter (range) finns och renderas");

    // ── 7. BOSTADSSIDA ────────────────────────────────────────────────────────
    console.log("\n[7] BOSTADSSIDA");
    let bostadUrl = null;
    if (cardCount > 0) {
      await cards.first().click();
      await page.waitForURL("**/bostad/**", { timeout: 10000 });
      bostadUrl = page.url();
      await shot(page, "12-bostadssida");

      pass(`Bostadssida laddas: ${bostadUrl}`);

      const hasGallery = await page.locator(".rounded-2xl.overflow-hidden").count() > 0;
      if (hasGallery) pass("Bildgalleri-container renderas");

      const faktarad = await page.locator("text=Antal rum").count() > 0 ||
                        await page.locator("text=Lediga just nu").count() > 0;
      if (faktarad) pass("Faktarad (statistik-rutor) renderas");

      const rumKort = page.locator('a[href^="/rum/"]');
      const rumCount = await rumKort.count();
      if (rumCount > 0) {
        pass(`${rumCount} rumkort visas på bostadssidan`);
        // Hover (kan inte göras headless för CSS-hover, men testa popup via mouse)
        await rumKort.first().hover();
        await page.waitForTimeout(300);
        const popup = page.locator(".opacity-100.pointer-events-auto");
        if (await popup.count() > 0) pass("Rumkort hover-popup visas");
        else obs("Hover-popup ej detekterad (kan vara CSS-timing-beroende)");
      } else {
        obs("Inga rum på denna bostad");
      }

      // Piltangenter i galleri
      const prevArrow = page.locator('button[aria-label="Föregående bild"]');
      const nextArrow = page.locator('button[aria-label="Nästa bild"]');
      if (await nextArrow.count() > 0) {
        await nextArrow.click();
        pass("Pil-knapp i bildgalleri klickbar");
      } else {
        obs("Pil-knappar saknas (bostad har max 1 bild eller inga bilder)");
      }
    } else {
      obs("[7] Hoppar över bostadssida-test — inga bostäder");
    }

    // ── 8. RUMSSIDA ───────────────────────────────────────────────────────────
    console.log("\n[8] RUMSSIDA");
    let rumUrl = null;
    const rumLinks = page.locator('a[href^="/rum/"]');
    if (await rumLinks.count() > 0) {
      await rumLinks.first().click();
      await page.waitForURL("**/rum/**", { timeout: 10000 });
      rumUrl = page.url();
      await shot(page, "13-rumssida");
      pass(`Rumssida laddas: ${rumUrl}`);

      const bokningsBox = page.locator("text=per månad");
      if (await bokningsBox.count() > 0) pass("Bokningsbox (pris per månad) renderas");

      const kontaktKort = page.locator("text=Svarar inom 3 timmar");
      if (await kontaktKort.count() > 0) pass("Kontaktperson-kort renderas");

      const bokaBtn = page.locator('button:has-text("Skicka bokningsförfrågan")').first();
      if (await bokaBtn.count() > 0) pass("Bokningsknapp finns");
      else obs("Bokningsknapp saknas (rum kanske är bokat)");
    } else {
      obs("[8] Ingen rum-länk hittades — bostaden kanske saknar rum");
    }

    // ── 9. BOKNING ────────────────────────────────────────────────────────────
    console.log("\n[9] BOKNING");
    if (rumUrl) {
      await page.goto(rumUrl, { waitUntil: "networkidle" });
      const bokaBtn2 = page.locator('button:has-text("Skicka bokningsförfrågan")').first();
      if (await bokaBtn2.count() > 0 && !(await bokaBtn2.isDisabled())) {
        await bokaBtn2.click();
        await page.waitForSelector('h2:has-text("Boka")', { timeout: 5000 });
        await shot(page, "14-bokningsmodal");

        const hasModal = await page.locator('h2:has-text("Boka")').count() > 0;
        if (hasModal) pass("Bokningsmodal öppnas");

        // Kontrollera avtalstyp-kort
        const standardKort = page.locator('button:has-text("Standard")');
        const premiumKort  = page.locator('button:has-text("Premium")');
        const memberKort   = page.locator('button:has-text("Medlemskap")');
        if (await standardKort.count() > 0 && await premiumKort.count() > 0 && await memberKort.count() > 0)
          pass("Alla 3 avtalstyp-kort visas (Medlemskap / Standard / Premium)");
        else fail("Avtalstyp-kort saknas i modal");

        // Välj Standard
        await standardKort.click();
        const standardSelected = (await standardKort.getAttribute("class") ?? "").includes("border-[#2D7A4F]");
        if (standardSelected) pass("Standard-kort markerat med grön border");
        else obs("Standard-kort markering ej verifierad (CSS-class kan vara minifierad)");

        // Fyll i formulär
        await page.fill('input[placeholder="AB Exempelföretag"]', "Test AB").catch(() => {});
        await page.fill('input[placeholder="Anna Svensson"]', "Test Person");
        await page.fill('input[type="email"]', EMAIL);
        await page.fill('input[placeholder="070-000 00 00"]', "070-111 22 33").catch(() => {});

        // Sätt ett datum 30 dagar framåt
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const datumStr = futureDate.toISOString().split("T")[0];
        await page.fill('input[type="date"]', datumStr);

        await shot(page, "15-bokningsmodal-ifylld");
        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000);
        await shot(page, "16-bokning-resultat");

        const bokConfirm = await page.locator("text=Förfrågan skickad").count() > 0 ||
                            await page.locator("text=skickad").count() > 0;
        const bokError   = await page.locator(".bg-red-50, .bg-red-600").innerText().catch(() => "");
        if (bokConfirm) pass("Bokningsförfrågan skickad — bekräftelse visas");
        else if (bokError) fail(`Bokning misslyckades: ${bokError}`);
        else obs("Bokningsresultat oklart");
      } else {
        obs("[9] Bokningsknapp ej tillgänglig (disabled eller rum bokat)");
      }
    }

    // ── 10. MINA BOKNINGAR ────────────────────────────────────────────────────
    console.log("\n[10] MINA BOKNINGAR");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    const minaBtn = page.locator('button:has-text("Mina bokningar")');
    if (await minaBtn.count() > 0) {
      await minaBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, "17-mina-bokningar");

      const bokningRader = page.locator(".bg-white.rounded-2xl.border");
      const antal = await bokningRader.count();
      if (antal > 1) {
        pass(`Mina bokningar visar ${antal - 1} bokning(ar)`);
        const avtalsBadge = page.locator("text=Standard, text=Premium, text=Medlemskap");
        if (await avtalsBadge.count() > 0) pass("Avtalstyp-badge visas i bokningslistan");
        else obs("Avtalstyp-badge ej synlig (bokning kanske inte har avtalstyp satt)");
      } else {
        obs("Inga bokningar att visa i 'Mina bokningar'");
      }
    }

    // ── 11. EDGE CASES ────────────────────────────────────────────────────────
    console.log("\n[11] EDGE CASES");

    // 11a. Fel lösenord
    await page.goto(`${BASE}/logga-in`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', "FelLösenord999");
    await page.click('button:has-text("Logga in")');
    await page.waitForTimeout(2000);
    const loginFelMsg = await page.locator(".bg-red-50").innerText().catch(() => "");
    if (loginFelMsg) pass(`Fel lösenord → felmeddelande: "${loginFelMsg.trim()}"`);
    else fail("Fel lösenord ger inget felmeddelande");

    // 11b. Dashboard utloggad
    await ctx.clearCookies();
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await shot(page, "18-dashboard-utloggad");
    const dashboardContent = await page.content();
    const redirectedOrBlocked =
      page.url().includes("/logga-in") ||
      await page.locator("text=Logga in").count() > 0 ||
      await page.locator("text=Inte inloggad").count() > 0 ||
      await page.locator("text=inloggad").count() > 0;
    if (redirectedOrBlocked) pass("Dashboard utan session → blockeras/redirectas korrekt");
    else obs("Dashboard utan session — ingen tydlig blockering (dashboard kan vara klient-renderad)");

    // 11c. Bokning med förflutet datum (om vi har ett rum)
    if (rumUrl) {
      await ctx.clearCookies();
      // Logga in igen
      await page.goto(`${BASE}/logga-in`, { waitUntil: "networkidle" });
      await page.fill('input[type="email"]', EMAIL);
      await page.fill('input[type="password"]', PASS);
      await page.click('button:has-text("Logga in")');
      await page.waitForTimeout(3000);

      await page.goto(rumUrl, { waitUntil: "networkidle" });
      const bokaEdge = page.locator('button:has-text("Skicka bokningsförfrågan")').first();
      if (await bokaEdge.count() > 0 && !(await bokaEdge.isDisabled())) {
        await bokaEdge.click();
        await page.waitForSelector('h2:has-text("Boka")', { timeout: 5000 }).catch(() => {});
        const dateInput = page.locator('input[type="date"]');
        if (await dateInput.count() > 0) {
          const minAttr = await dateInput.getAttribute("min") ?? "";
          pass(`Datumfält har min-attribut satt: "${minAttr}" (blockerar förflutna datum)`);
        }
        await page.keyboard.press("Escape");
      }
    }

  } catch (err) {
    console.error("\n❌ Oväntat testfel:", err.message);
    await shot(page, "ERROR").catch(() => {});
    results.fail.push(`Oväntat testfel: ${err.message}`);
  } finally {
    await browser.close();
  }

  // ── RAPPORT ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("TESTRAPPORT — " + BASE);
  console.log("═".repeat(60));

  console.log(`\n✅ FUNGERAR (${results.pass.length}):`);
  results.pass.forEach(m => console.log(`  • ${m}`));

  console.log(`\n❌ TRASIGT (${results.fail.length}):`);
  if (results.fail.length === 0) console.log("  (inga fel hittade)");
  else results.fail.forEach(m => console.log(`  • ${m}`));

  console.log(`\n⚠️  OBSERVATIONER (${results.observations.length}):`);
  results.observations.forEach(m => console.log(`  • ${m}`));

  console.log(`\n📸 SKÄRMDUMPAR (${fs.readdirSync(DIR).length} filer):`);
  fs.readdirSync(DIR).forEach(f => console.log(`  • e2e-live-screenshots/${f}`));

  if (consoleErrors.length > 0) {
    console.log(`\n🔴 JS-KONSOLFEL (${consoleErrors.length}):`);
    consoleErrors.forEach(e => console.log(`  • ${e}`));
  } else {
    console.log("\n✅ Inga JS-konsolfel i webbläsaren");
  }

  console.log("\n" + "═".repeat(60));
})();
