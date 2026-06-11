import { requireAdmin } from "@/lib/auth";
import type { NextRequest } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 85;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Ingen fil skickad" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Bara jpg, png och webp är tillåtna" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Filen får max vara 5 MB" }, { status: 400 });
  }

  // Optimera: max 1920px bredd (förstora aldrig), konvertera till WebP q85
  let optimized: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    optimized = await sharp(inputBuffer)
      .rotate() // respektera EXIF-orientering
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    console.error("[upload] sharp-fel:", err);
    return Response.json({ error: "Kunde inte bearbeta bilden" }, { status: 400 });
  }

  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(baseName, optimized, {
      access: "public",
      contentType: "image/webp",
    });
    return Response.json({ url: blob.url });
  }

  // Lokal fallback: spara i public/uploads/
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, baseName), optimized);

  return Response.json({ url: `/uploads/${baseName}` });
}
