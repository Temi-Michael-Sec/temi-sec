"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostBody } from "@/components/post/PostBody";
import { Palette } from "./Palette";
import { labelClass } from "./styles";

/**
 * The split-pane body editor: Markdown source on the left, live preview on the
 * right. The preview renders through the same `renderMarkdown` the publish flow
 * uses (via /api/admin/preview) and is displayed with the very same `PostBody`
 * component the public post pages use — so what you write is what will ship.
 *
 * Owns the body state and renders a `<textarea name="body">`, so the parent
 * <form> submits the current value with no extra wiring.
 */

const PREVIEW_DEBOUNCE_MS = 400;

export function BodyEditor({ initialBody }: { initialBody: string }) {
  const [body, setBody] = useState(initialBody);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Pending selection to restore after a state-driven re-render.
  const pendingSelection = useRef<[number, number] | null>(null);

  // Debounced live preview.
  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (res.ok) {
          const { html } = await res.json();
          setPreviewHtml(html);
        }
      } catch {
        // Transient preview failure is non-fatal — keep the last good render.
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [body]);

  // Restore cursor/selection after palette edits re-render the textarea.
  useEffect(() => {
    if (pendingSelection.current && textareaRef.current) {
      const [start, end] = pendingSelection.current;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      pendingSelection.current = null;
    }
  }, [body]);

  const wrap = useCallback(
    (before: string, after: string, placeholder: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const { selectionStart: s, selectionEnd: e } = ta;
      const selected = body.slice(s, e) || placeholder;
      setBody(body.slice(0, s) + before + selected + after + body.slice(e));
      pendingSelection.current = [
        s + before.length,
        s + before.length + selected.length,
      ];
    },
    [body],
  );

  const insert = useCallback(
    (block: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const { selectionStart: s, selectionEnd: e } = ta;
      const pre = body.slice(0, s);
      const post = body.slice(e);
      const nlBefore = pre && !pre.endsWith("\n") ? "\n" : "";
      const nlAfter = post && !post.startsWith("\n") ? "\n" : "";
      const text = nlBefore + block + nlAfter;
      setBody(pre + text + post);
      // Drop the cursor into the first blank line of a block (callouts, code
      // fences), else at the block's end.
      const gap = block.indexOf("\n\n");
      const caret =
        gap >= 0 ? s + nlBefore.length + gap + 1 : s + text.length;
      pendingSelection.current = [caret, caret];
    },
    [body],
  );

  const insertImage = useCallback(
    (url: string) => {
      const alt = window.prompt("Alt text (describe the image):", "") ?? "";
      insert(`![${alt}](${url})`);
    },
    [insert],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          window.alert(data.error ?? "Upload failed.");
          return;
        }
        insertImage(data.url);
      } catch {
        window.alert("Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [insertImage],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  // Paste an image straight from the clipboard (screenshots — the common path).
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();
    if (file) {
      e.preventDefault();
      uploadFile(file);
    }
  };

  return (
    <div>
      <span className={labelClass}>Body</span>
      <div className="mt-1 rounded-md border border-border">
        <div className="p-2">
          <Palette
            onWrap={wrap}
            onInsert={insert}
            onUploadClick={() => fileInputRef.current?.click()}
            uploading={uploading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
        <div className="grid gap-px bg-border md:grid-cols-2">
          <textarea
            ref={textareaRef}
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onPaste={onPaste}
            spellCheck={false}
            placeholder="Write in Markdown…"
            className="min-h-[28rem] w-full resize-y bg-surface p-4 font-mono text-sm text-foreground outline-none"
          />
          <div className="min-h-[28rem] overflow-auto bg-background p-4">
            {previewHtml ? (
              // `key` remounts PostBody whenever the rendered html changes, so
              // each preview is a clean mount that enhances once. Without it,
              // repeatedly resetting dangerouslySetInnerHTML while PostBody does
              // its own DOM surgery leaves stale/empty nodes — which made a
              // YouTube embed (an empty div until enhanced) vanish on edit.
              <PostBody key={previewHtml} html={previewHtml} />
            ) : (
              <p className="font-mono text-sm text-faint">Preview…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
