import { requireAdmin } from "@/lib/auth";
import type { NextRequest } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(file.name, file, { access: "public" });
    return Response.json({ url: blob.url });
  }

  // Lokal fallback: spara i public/uploads/
  const { writeFile, mkdir } = await import("fs/promises");
  const { join, extname } = await import("path");

  const ext = extname(file.name) || ".jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, fileName), Buffer.from(bytes));

  return Response.json({ url: `/uploads/${fileName}` });
}
