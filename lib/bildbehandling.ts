import sharp from "sharp";

// ─── Bildbehandling för publika bostads- och rumsbilder ──────────────────────
// Används av /api/upload OCH av importskript i scripts/, så att bilder som
// läggs upp på olika vägar alltid bearbetas likadant.
//
// Filen importeras direkt av Node i scripts/ (utan Next) — importera därför
// inget via "@/"-alias här.

export const MAX_WIDTH = 1920;
export const WEBP_QUALITY = 85;

/** Max 1920 px bredd (förstorar aldrig), EXIF-rotation, WebP q85. */
export async function optimeraBild(indata: Buffer): Promise<Buffer> {
  return sharp(indata)
    .rotate() // respektera EXIF-orientering
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/** Unikt filnamn för en optimerad bild, t.ex. "1759567200000-k3j2h1x9.webp". */
export function nyttBildnamn(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
}
