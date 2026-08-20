"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostBody } from "@/components/post/PostBody";
import { Palette } from "./Palette";
import { AlertDialog, PromptDialog } from "./Modal";
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

export function BodyEditor({
  initialBody,
  onChange,
}: {
  initialBody: string;
  /** Fired on every body change — including programmatic palette/image inserts
   *  that don't emit a DOM change event — so the parent can schedule autosave. */
  onChange?: () => void;
}) {
  const [body, setBody] = useState(initialBody);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploading, setUploading] = useState(false);
  // Upload-failure message (drives the AlertDialog) and the just-uploaded image
  // URL awaiting alt text (drives the PromptDialog) — replacing window.alert /
  // window.prompt.
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Pending selection to restore after a state-driven re-render.
  const pendingSelection = useRef<[number, number] | null>(null);
  const bodyMounted = useRef(false);

  // Notify the parent whenever the body changes (typing OR palette/upload
  // inserts, which don't emit a DOM change event). Skips the initial mount so
  // loading a draft isn't treated as a change. Depends only on `body`:
  // `onChange` reads only refs/stable values, so a stale closure is harmless.
  useEffect(() => {
    if (!bodyMounted.current) {
      bodyMounted.current = true;
      return;
    }
    onChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

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

  // Insert the uploaded image once the user has supplied (or skipped) alt text.
  const finishImageInsert = useCallback(
    (alt: string) => {
      if (pendingImageUrl) insert(`![${alt}](${pendingImageUrl})`);
      setPendingImageUrl(null);
    },
    [insert, pendingImageUrl],
  );

  const uploadFile = useCallback(async (file: File) => {
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
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      // Open the alt-text prompt; the image is inserted on confirm/cancel.
      setPendingImageUrl(data.url);
    } catch {
      setUploadError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

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
              // repeatedly replacing the injected markup while PostBody does its
              // own DOM surgery leaves stale/empty nodes — which made a YouTube
              // embed (an empty div until enhanced) vanish on edit.
              <PostBody key={previewHtml} html={previewHtml} />
            ) : (
              <p className="font-mono text-sm text-faint">Preview…</p>
            )}
          </div>
        </div>
      </div>

      <PromptDialog
        open={pendingImageUrl !== null}
        title="Add alt text"
        label="Describe the image — read by screen readers and shown if it fails to load. Leave blank to skip."
        placeholder="e.g. nmap scan output showing open ports"
        confirmLabel="Insert image"
        onSubmit={finishImageInsert}
        onCancel={() => finishImageInsert("")}
      />

      <AlertDialog
        open={uploadError !== null}
        title="Upload failed"
        message={uploadError ?? ""}
        onClose={() => setUploadError(null)}
      />
    </div>
  );
}
