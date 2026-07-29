import { getAdmin } from "@/lib/auth/require-admin";
import { getCloudinaryConfig } from "@/lib/env";
import { uploadImage } from "@/lib/cloudinary";

/**
 * Editor image upload. Admin-only, validated server-side — the client cannot be
 * trusted about type or size. SVG is deliberately excluded: it can carry script,
 * and a stored SVG served inline is an XSS vector no image resize removes.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response(null, { status: 401 });

  if (!getCloudinaryConfig()) {
    return Response.json(
      { error: "Image uploads are not configured on this environment." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Unsupported image type. Use PNG, JPEG, WebP, GIF or AVIF." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image exceeds the 5 MB limit." }, { status: 413 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = await uploadImage(bytes);
    return Response.json(image);
  } catch (err) {
    console.error("[admin/upload]", err);
    return Response.json({ error: "Upload failed." }, { status: 502 });
  }
}
