import { Resend } from "resend";
import { formateraDatum } from "@/lib/datum";

const GRON = "#2D7A4F";
const MORK = "#1a1a1a";
const LJUS = "#f8f7f4";
const ACCENT = "#e8f5ee";

type BokningData = {
  id: string;
  kund_foretag: string | null;
  kund_orgnr: string | null;
  kund_kontaktperson: string;
  boende_namn: string | null;
  email: string;
  telefon: string | null;
  startdatum: Date;
  avtalstyp: string;
};

type RumData = {
  namn: string;
  manadshyra: number;
};

type BostadData = {
  namn: string;
  stadsdel: string | null;
  adress: string | null;
};

type OffertData = {
  id: string;
  foretag: string;
  orgnr: string | null;
  kontaktperson: string;
  email: string;
  telefon: string;
  stad: string;
  antal_personer: number | null;
  inflyttning: Date | null;
  bostadstyp: string | null;
  meddelande: string | null;
};

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getConfig() {
  // AVSANDAR_EMAIL kan vara en ren adress — då läggs avsändarnamnet på här
  const avsandare = process.env.AVSANDAR_EMAIL ?? "no-reply@reloka.se";
  return {
    from: avsandare.includes("<") ? avsandare : `ReLoka <${avsandare}>`,
    adminEmail: process.env.ADMIN_EMAIL ?? "",
  };
}

// Resend-SDK:n KASTAR INTE vid API-fel — den returnerar { data, error }.
// error-fältet måste kontrolleras, annars försvinner nekade utskick spårlöst.
function resendFel(svar: unknown): string | null {
  const s = svar as { error?: { name?: string; message?: string } | null };
  if (!s?.error) return null;
  return `${s.error.name ?? "fel"}: ${s.error.message ?? "okänt fel"}`;
}

function avtalstypLabel(t: string): string {
  if (t === "premium") return "Premium";
  if (t === "medlemskap") return "Medlemskap";
  return "Standard";
}

function bostadstypLabel(t: string | null): string {
  if (!t) return "—";
  if (t === "privat_rum") return "Privat rum";
  if (t === "rum_eget_bad") return "Rum med eget bad";
  if (t === "hel_lagenhet") return "Hel lägenhet";
  if (t === "vet_ej") return "Vet ej";
  return t;
}

// ─── Layout-hjälpare ────────────────────────────────────────────────────────

function wrapper(innehall: string): string {
  return `
    <div style="background:${LJUS};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${MORK};">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <div style="background:#fff;padding:24px 32px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">
            Re<span style="color:${GRON};">Loka</span>
          </div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;letter-spacing:0.5px;">Linköping &amp; Norrköping</div>
        </div>
        <div style="padding:32px;">
          ${innehall}
        </div>
        <div style="background:${LJUS};padding:20px 32px;font-size:12px;color:#6b7280;border-top:1px solid #f0f0f0;">
          ReLoka AB · Linköping, Sverige<br/>
          <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
        </div>
      </div>
    </div>
  `;
}

function rad(label: string, varde: string): string {
  return `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#9ca3af;width:160px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:${MORK};">${varde}</td>
    </tr>
  `;
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "—";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Text-hjälpare (plain text-version krävs för god leveranssäkerhet) ──────

function visa(s: string | null | undefined): string {
  return s && String(s).trim() ? String(s) : "—";
}

const TEXT_FOT = "\nReLoka AB · Linköping, Sverige\ninfo@reloka.se";

// ─── Bekräftelsemail: bokning ───────────────────────────────────────────────

export async function skickaBokningsmail(
  bokning: BokningData,
  rum: RumData,
  bostad: BostadData
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY saknas — hoppar över mail-utskick");
    return { ok: false, error: "RESEND_API_KEY saknas" };
  }

  const { from, adminEmail } = getConfig();
  const plats = bostad.stadsdel ?? bostad.adress ?? bostad.namn;
  const startdatum = formateraDatum(bokning.startdatum);

  // ── Mail till kund ──
  const kundHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">
      Tack ${escapeHtml(bokning.kund_kontaktperson)}!
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      Vi har tagit emot din förfrågan. Vi återkommer normalt inom 3 timmar på vardagar
      med ett besked om tillgänglighet och nästa steg.
    </p>

    <div style="background:${ACCENT};border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${GRON};margin-bottom:8px;">
        Sammanfattning
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${rad("Rum", escapeHtml(rum.namn))}
        ${rad("Bostad", escapeHtml(bostad.namn))}
        ${rad("Plats", escapeHtml(plats))}
        ${rad("Hyra", `${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`)}
        ${rad("Startdatum", startdatum)}
        ${rad("Avtalstyp", avtalstypLabel(bokning.avtalstyp))}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:${MORK};">Frågor? Kontakta oss direkt:</p>
    <p style="margin:0;font-size:14px;">
      <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
    </p>
  `);

  // ── Mail till admin ──
  const adminHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;">
      Ny bokningsförfrågan
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
      Från ${escapeHtml(bokning.kund_kontaktperson)}${bokning.kund_foretag ? ` (${escapeHtml(bokning.kund_foretag)})` : ""}
    </p>

    <table style="width:100%;border-collapse:collapse;">
      ${rad("Företag", escapeHtml(bokning.kund_foretag))}
      ${rad("Org.nr", escapeHtml(bokning.kund_orgnr))}
      ${rad("Kontaktperson", escapeHtml(bokning.kund_kontaktperson))}
      ${rad("Boende (namn)", escapeHtml(bokning.boende_namn))}
      ${rad("E-post", escapeHtml(bokning.email))}
      ${rad("Telefon", escapeHtml(bokning.telefon))}
      ${rad("Rum", escapeHtml(rum.namn))}
      ${rad("Bostad", escapeHtml(bostad.namn))}
      ${rad("Plats", escapeHtml(plats))}
      ${rad("Hyra", `${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`)}
      ${rad("Startdatum", startdatum)}
      ${rad("Avtalstyp", avtalstypLabel(bokning.avtalstyp))}
      ${rad("Bokning-ID", bokning.id)}
    </table>
  `);

  const kundText = [
    `Tack ${bokning.kund_kontaktperson}!`,
    "",
    "Vi har tagit emot din förfrågan. Vi återkommer normalt inom 3 timmar på vardagar med ett besked om tillgänglighet och nästa steg.",
    "",
    "Sammanfattning",
    `Rum: ${rum.namn}`,
    `Bostad: ${bostad.namn}`,
    `Plats: ${visa(plats)}`,
    `Hyra: ${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`,
    `Startdatum: ${startdatum}`,
    `Avtalstyp: ${avtalstypLabel(bokning.avtalstyp)}`,
    "",
    "Frågor? Kontakta oss direkt: info@reloka.se",
    TEXT_FOT,
  ].join("\n");

  const adminText = [
    `Ny bokningsförfrågan från ${bokning.kund_kontaktperson}${bokning.kund_foretag ? ` (${bokning.kund_foretag})` : ""}`,
    "",
    `Företag: ${visa(bokning.kund_foretag)}`,
    `Org.nr: ${visa(bokning.kund_orgnr)}`,
    `Kontaktperson: ${bokning.kund_kontaktperson}`,
    `Boende (namn): ${visa(bokning.boende_namn)}`,
    `E-post: ${bokning.email}`,
    `Telefon: ${visa(bokning.telefon)}`,
    `Rum: ${rum.namn}`,
    `Bostad: ${bostad.namn}`,
    `Plats: ${visa(plats)}`,
    `Hyra: ${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`,
    `Startdatum: ${startdatum}`,
    `Avtalstyp: ${avtalstypLabel(bokning.avtalstyp)}`,
    `Bokning-ID: ${bokning.id}`,
    TEXT_FOT,
  ].join("\n");

  try {
    const tasks: Promise<unknown>[] = [
      resend.emails.send({
        from,
        to: bokning.email,
        // Reply-to till bemannad inkorg — svar på no-reply ska inte studsa
        ...(adminEmail ? { replyTo: adminEmail } : {}),
        subject: "Vi har tagit emot din förfrågan — ReLoka",
        html: kundHtml,
        text: kundText,
      }),
    ];
    if (adminEmail) {
      tasks.push(
        resend.emails.send({
          from,
          to: adminEmail,
          // Svar på notisen går direkt till kunden
          replyTo: bokning.email,
          subject: `Ny bokningsförfrågan från ${bokning.kund_kontaktperson}`,
          html: adminHtml,
          text: adminText,
        })
      );
    }
    const svar = await Promise.all(tasks);
    const fel = svar.map(resendFel).filter((f): f is string => f !== null);
    if (fel.length > 0) {
      console.error("[email] Bokningsmail nekades av Resend:", fel.join(" | "));
      return { ok: false, error: fel.join(" | ") };
    }
    console.log(
      `[email] Bokningsmail skickat — kundbekräftelse to=${bokning.email}${adminEmail ? `, adminnotis to=${adminEmail}` : ""}`
    );
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka bokningsmail:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Statusmail: bokning bekräftad/avbokad ──────────────────────────────────

type StatusBokningData = {
  id: string;
  kund_kontaktperson: string;
  email: string;
  startdatum: Date;
  slutdatum: Date | null;
  avtalstyp: string;
};

export async function skickaBokningsstatusMail(
  bokning: StatusBokningData,
  rum: RumData,
  bostad: BostadData,
  nyStatus: "bekraftad" | "avbokad"
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY saknas — hoppar över statusmail");
    return { ok: false, error: "RESEND_API_KEY saknas" };
  }

  // Skicka bara till en adress som ser ut som en e-postadress
  if (!bokning.email || !bokning.email.includes("@")) {
    console.warn(
      `[email] Statusmejl hoppas över — ogiltig mottagaradress på bokning ${bokning.id}:`,
      bokning.email
    );
    return { ok: false, error: "Ogiltig mottagaradress" };
  }

  const { from, adminEmail } = getConfig();
  const plats = bostad.stadsdel ?? bostad.adress ?? bostad.namn;
  const startdatum = formateraDatum(bokning.startdatum);
  const slutdatum = bokning.slutdatum ? formateraDatum(bokning.slutdatum) : "Tills vidare";

  let amne: string;
  let html: string;
  let text: string;

  if (nyStatus === "bekraftad") {
    amne = "Din bokningsförfrågan är bekräftad — ReLoka";
    html = wrapper(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">
        Din bokningsförfrågan är bekräftad
      </h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hej ${escapeHtml(bokning.kund_kontaktperson)}. Vi har bekräftat er bokning.
        Vi återkommer inom kort med kontrakt och praktiska detaljer inför inflyttningen.
      </p>

      <div style="background:${ACCENT};border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${GRON};margin-bottom:8px;">
          Er bokning
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${rad("Rum", escapeHtml(rum.namn))}
          ${rad("Bostad", escapeHtml(bostad.namn))}
          ${rad("Plats", escapeHtml(plats))}
          ${rad("Hyra", `${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`)}
          ${rad("Startdatum", startdatum)}
          ${rad("Slutdatum", slutdatum)}
          ${rad("Avtalstyp", avtalstypLabel(bokning.avtalstyp))}
        </table>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:${MORK};">Frågor? Kontakta oss direkt:</p>
      <p style="margin:0;font-size:14px;">
        <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
      </p>
    `);
    text = [
      "Din bokningsförfrågan är bekräftad",
      "",
      `Hej ${bokning.kund_kontaktperson}. Vi har bekräftat er bokning. Vi återkommer inom kort med kontrakt och praktiska detaljer inför inflyttningen.`,
      "",
      "Er bokning",
      `Rum: ${rum.namn}`,
      `Bostad: ${bostad.namn}`,
      `Plats: ${visa(plats)}`,
      `Hyra: ${rum.manadshyra.toLocaleString("sv-SE")} kr/mån`,
      `Startdatum: ${startdatum}`,
      `Slutdatum: ${slutdatum}`,
      `Avtalstyp: ${avtalstypLabel(bokning.avtalstyp)}`,
      "",
      "Frågor? Kontakta oss direkt: info@reloka.se",
      TEXT_FOT,
    ].join("\n");
  } else {
    amne = "Angående din bokningsförfrågan — ReLoka";
    html = wrapper(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">
        Angående din bokningsförfrågan
      </h1>
      <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hej ${escapeHtml(bokning.kund_kontaktperson)}. Din bokningsförfrågan för
        ${escapeHtml(rum.namn)} i ${escapeHtml(bostad.namn)} har avbokats och kunde
        tyvärr inte genomföras den här gången.
      </p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Ni är varmt välkomna att höra av er igen — vi hjälper gärna till att hitta
        ett annat boende eller ett annat datum som passar.
      </p>

      <p style="margin:0 0 8px;font-size:14px;color:${MORK};">Kontakta oss direkt:</p>
      <p style="margin:0;font-size:14px;">
        <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
      </p>
    `);
    text = [
      "Angående din bokningsförfrågan",
      "",
      `Hej ${bokning.kund_kontaktperson}. Din bokningsförfrågan för ${rum.namn} i ${bostad.namn} har avbokats och kunde tyvärr inte genomföras den här gången.`,
      "",
      "Ni är varmt välkomna att höra av er igen — vi hjälper gärna till att hitta ett annat boende eller ett annat datum som passar.",
      "",
      "Kontakta oss direkt: info@reloka.se",
      TEXT_FOT,
    ].join("\n");
  }

  try {
    const svar = await resend.emails.send({
      from,
      to: bokning.email,
      // Reply-to till bemannad inkorg — svar på no-reply ska inte studsa
      ...(adminEmail ? { replyTo: adminEmail } : {}),
      subject: amne,
      html,
      text,
    });
    const fel = resendFel(svar);
    if (fel) {
      console.error(
        `[email] Statusmejl (${nyStatus}) till ${bokning.email} NEKADES av Resend:`,
        fel
      );
      return { ok: false, error: fel };
    }
    console.log(
      `[email] Statusmejl (${nyStatus}) skickat — to=${bokning.email}, reply-to=${adminEmail || "(ingen)"}`
    );
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka statusmail:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Adminnotis: ny hyresvärdsanmälan ───────────────────────────────────────

type HyresvardsanmalanData = {
  id: string;
  namn: string;
  telefon: string | null;
  email: string;
  stad: string | null;
  adress: string | null;
  meddelande: string | null;
};

export async function skickaHyresvardsnotisMail(
  anmalan: HyresvardsanmalanData
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY saknas — hoppar över hyresvärdsnotis");
    return { ok: false, error: "RESEND_API_KEY saknas" };
  }

  const { from, adminEmail } = getConfig();
  if (!adminEmail) {
    console.warn("[email] ADMIN_EMAIL saknas — hoppar över hyresvärdsnotis");
    return { ok: false, error: "ADMIN_EMAIL saknas" };
  }

  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;">
      Ny hyresvärdsanmälan
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
      Från ${escapeHtml(anmalan.namn)}${anmalan.stad ? ` (${escapeHtml(anmalan.stad)})` : ""}
    </p>

    <table style="width:100%;border-collapse:collapse;">
      ${rad("Namn", escapeHtml(anmalan.namn))}
      ${rad("E-post", escapeHtml(anmalan.email))}
      ${rad("Telefon", escapeHtml(anmalan.telefon))}
      ${rad("Stad", escapeHtml(anmalan.stad))}
      ${rad("Adress", escapeHtml(anmalan.adress))}
      ${rad("Meddelande", anmalan.meddelande ? escapeHtml(anmalan.meddelande).replace(/\n/g, "<br/>") : "—")}
      ${rad("Anmälan-ID", anmalan.id)}
    </table>
  `);

  const text = [
    `Ny hyresvärdsanmälan från ${anmalan.namn}`,
    "",
    `Namn: ${anmalan.namn}`,
    `E-post: ${anmalan.email}`,
    `Telefon: ${visa(anmalan.telefon)}`,
    `Stad: ${visa(anmalan.stad)}`,
    `Adress: ${visa(anmalan.adress)}`,
    `Meddelande: ${visa(anmalan.meddelande)}`,
    `Anmälan-ID: ${anmalan.id}`,
    TEXT_FOT,
  ].join("\n");

  try {
    const svar = await resend.emails.send({
      from,
      to: adminEmail,
      // Svar på notisen går direkt till anmälaren
      replyTo: anmalan.email,
      subject: `Ny hyresvärdsanmälan från ${anmalan.namn}`,
      html,
      text,
    });
    const fel = resendFel(svar);
    if (fel) {
      console.error("[email] Hyresvärdsnotis nekades av Resend:", fel);
      return { ok: false, error: fel };
    }
    console.log(`[email] Hyresvärdsnotis skickad till ${adminEmail}`);
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka hyresvärdsnotis:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Bekräftelsemail: offertförfrågan ───────────────────────────────────────

export async function skickaOffertmail(
  offert: OffertData
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY saknas — hoppar över mail-utskick");
    return { ok: false, error: "RESEND_API_KEY saknas" };
  }

  const { from, adminEmail } = getConfig();
  const inflyttning = offert.inflyttning ? formateraDatum(offert.inflyttning) : null;

  // ── Mail till kund ──
  const kundHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">
      Tack ${escapeHtml(offert.kontaktperson)}!
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      Vi har tagit emot er offertförfrågan för ${escapeHtml(offert.foretag)}.
      Vi återkommer normalt inom 3 timmar på vardagar med ett skräddarsytt förslag.
    </p>

    <div style="background:${ACCENT};border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${GRON};margin-bottom:8px;">
        Er förfrågan
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${rad("Företag", escapeHtml(offert.foretag))}
        ${rad("Stad", escapeHtml(offert.stad))}
        ${rad("Antal personer", offert.antal_personer ? String(offert.antal_personer) : "—")}
        ${rad("Önskad inflyttning", inflyttning ?? "—")}
        ${rad("Bostadstyp", bostadstypLabel(offert.bostadstyp))}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:${MORK};">Brådskande? Kontakta oss direkt:</p>
    <p style="margin:0;font-size:14px;">
      <a href="mailto:info@reloka.se" style="color:${GRON};text-decoration:none;">info@reloka.se</a>
    </p>
  `);

  // ── Mail till admin ──
  const adminHtml = wrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;">
      Ny offertförfrågan
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
      Från ${escapeHtml(offert.kontaktperson)} (${escapeHtml(offert.foretag)})
    </p>

    <table style="width:100%;border-collapse:collapse;">
      ${rad("Företag", escapeHtml(offert.foretag))}
      ${rad("Org.nr", escapeHtml(offert.orgnr))}
      ${rad("Kontaktperson", escapeHtml(offert.kontaktperson))}
      ${rad("E-post", escapeHtml(offert.email))}
      ${rad("Telefon", escapeHtml(offert.telefon))}
      ${rad("Stad", escapeHtml(offert.stad))}
      ${rad("Antal personer", offert.antal_personer ? String(offert.antal_personer) : "—")}
      ${rad("Inflyttning", inflyttning ?? "—")}
      ${rad("Bostadstyp", bostadstypLabel(offert.bostadstyp))}
      ${rad("Meddelande", offert.meddelande ? escapeHtml(offert.meddelande).replace(/\n/g, "<br/>") : "—")}
      ${rad("Offert-ID", offert.id)}
    </table>
  `);

  const kundText = [
    `Tack ${offert.kontaktperson}!`,
    "",
    `Vi har tagit emot er offertförfrågan för ${offert.foretag}. Vi återkommer normalt inom 3 timmar på vardagar med ett skräddarsytt förslag.`,
    "",
    "Er förfrågan",
    `Företag: ${offert.foretag}`,
    `Stad: ${offert.stad}`,
    `Antal personer: ${offert.antal_personer ? String(offert.antal_personer) : "—"}`,
    `Önskad inflyttning: ${inflyttning ?? "—"}`,
    `Bostadstyp: ${bostadstypLabel(offert.bostadstyp)}`,
    "",
    "Brådskande? Kontakta oss direkt: info@reloka.se",
    TEXT_FOT,
  ].join("\n");

  const adminText = [
    `Ny offertförfrågan från ${offert.kontaktperson} (${offert.foretag})`,
    "",
    `Företag: ${offert.foretag}`,
    `Org.nr: ${visa(offert.orgnr)}`,
    `Kontaktperson: ${offert.kontaktperson}`,
    `E-post: ${offert.email}`,
    `Telefon: ${offert.telefon}`,
    `Stad: ${offert.stad}`,
    `Antal personer: ${offert.antal_personer ? String(offert.antal_personer) : "—"}`,
    `Inflyttning: ${inflyttning ?? "—"}`,
    `Bostadstyp: ${bostadstypLabel(offert.bostadstyp)}`,
    `Meddelande: ${visa(offert.meddelande)}`,
    `Offert-ID: ${offert.id}`,
    TEXT_FOT,
  ].join("\n");

  try {
    const tasks: Promise<unknown>[] = [
      resend.emails.send({
        from,
        to: offert.email,
        // Reply-to till bemannad inkorg — svar på no-reply ska inte studsa
        ...(adminEmail ? { replyTo: adminEmail } : {}),
        subject: "Vi har tagit emot er offertförfrågan — ReLoka",
        html: kundHtml,
        text: kundText,
      }),
    ];
    if (adminEmail) {
      tasks.push(
        resend.emails.send({
          from,
          to: adminEmail,
          // Svar på notisen går direkt till kunden
          replyTo: offert.email,
          subject: `Ny offertförfrågan från ${offert.kontaktperson} (${offert.foretag})`,
          html: adminHtml,
          text: adminText,
        })
      );
    }
    const svar = await Promise.all(tasks);
    const fel = svar.map(resendFel).filter((f): f is string => f !== null);
    if (fel.length > 0) {
      console.error("[email] Offertmail nekades av Resend:", fel.join(" | "));
      return { ok: false, error: fel.join(" | ") };
    }
    console.log(
      `[email] Offertmail skickat — kundbekräftelse to=${offert.email}${adminEmail ? `, adminnotis to=${adminEmail}` : ""}`
    );
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka offertmail:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
