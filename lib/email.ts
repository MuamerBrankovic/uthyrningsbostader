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
  return {
    from: process.env.AVSANDAR_EMAIL ?? "onboarding@resend.dev",
    adminEmail: process.env.ADMIN_EMAIL ?? "",
  };
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

  try {
    const tasks: Promise<unknown>[] = [
      resend.emails.send({
        from,
        to: bokning.email,
        subject: "Vi har tagit emot din förfrågan — ReLoka",
        html: kundHtml,
      }),
    ];
    if (adminEmail) {
      tasks.push(
        resend.emails.send({
          from,
          to: adminEmail,
          subject: `Ny bokningsförfrågan från ${bokning.kund_kontaktperson}`,
          html: adminHtml,
        })
      );
    }
    await Promise.all(tasks);
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka bokningsmail:", err);
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

  try {
    const tasks: Promise<unknown>[] = [
      resend.emails.send({
        from,
        to: offert.email,
        subject: "Vi har tagit emot er offertförfrågan — ReLoka",
        html: kundHtml,
      }),
    ];
    if (adminEmail) {
      tasks.push(
        resend.emails.send({
          from,
          to: adminEmail,
          subject: `Ny offertförfrågan från ${offert.kontaktperson} (${offert.foretag})`,
          html: adminHtml,
        })
      );
    }
    await Promise.all(tasks);
    return { ok: true };
  } catch (err) {
    console.error("[email] Misslyckades skicka offertmail:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
