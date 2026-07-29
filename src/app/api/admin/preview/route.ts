import { getAdmin } from "@/lib/auth/require-admin";
import { renderMarkdown } from "@/lib/markdown/render";

/**
 * Live-preview renderer for the editor. Runs the author's Markdown through the
 * exact same `renderMarkdown` the publish flow uses, so what the split-pane
 * shows is byte-for-byte what will be stored and served. Admin-only — it is a
 * render endpoint, not public.
 */
export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response(null, { status: 401 });

  let body = "";
  try {
    const json = await request.json();
    if (typeof json?.body === "string") body = json.body;
  } catch {
    // Empty/invalid body renders as empty preview.
  }

  const html = await renderMarkdown(body);
  return Response.json({ html });
}
