// Delad telefonvalidering — används av både formulär (klient) och API-routes
// (server). Tillåter siffror, mellanslag, bindestreck och inledande +,
// 7–15 tecken. Exempel som godkänns: "013-123 45 67", "+46701234567".
export const TELEFON_REGEX = /^[+]?[\d\s-]{7,15}$/;

export const TELEFON_FELTEXT = "Ange ett giltigt telefonnummer";

// Tar unknown så API-routes kan skicka in obehandlad body-data utan att krascha
export function arGiltigtTelefonnummer(s: unknown): s is string {
  return typeof s === "string" && TELEFON_REGEX.test(s.trim());
}
