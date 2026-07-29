"use client";

/**
 * The component palette — a thin insertion layer over the Markdown/directive
 * grammar the renderer already understands (see lib/markdown/directives.ts).
 * Each button either wraps the selection or drops in a block; it adds no new
 * render capability, so nothing here can outrun what the sanitizer allows.
 */

interface PaletteProps {
  onWrap: (before: string, after: string, placeholder: string) => void;
  onInsert: (block: string) => void;
  onUploadClick: () => void;
  uploading: boolean;
}

const btn =
  "rounded border border-border bg-surface px-2 py-1 font-mono text-xs " +
  "text-muted transition-colors hover:border-accent hover:text-foreground " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Palette({
  onWrap,
  onInsert,
  onUploadClick,
  uploading,
}: PaletteProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
      <button type="button" className={btn} title="Bold" onClick={() => onWrap("**", "**", "bold")}>
        B
      </button>
      <button type="button" className={btn} title="Italic" onClick={() => onWrap("_", "_", "italic")}>
        i
      </button>
      <button type="button" className={btn} title="Inline code" onClick={() => onWrap("`", "`", "code")}>
        {"</>"}
      </button>
      <button type="button" className={btn} title="Link" onClick={() => onWrap("[", "](https://)", "text")}>
        link
      </button>

      <span className="mx-1 h-4 w-px bg-border" />

      <button type="button" className={btn} title="Heading" onClick={() => onInsert("## Heading")}>
        H2
      </button>
      <button
        type="button"
        className={btn}
        title="Code block"
        onClick={() => onInsert("```bash\n\n```")}
      >
        code
      </button>
      <button
        type="button"
        className={btn}
        title="Table"
        onClick={() =>
          onInsert("| Column | Column |\n| --- | --- |\n| cell | cell |")
        }
      >
        table
      </button>

      <span className="mx-1 h-4 w-px bg-border" />

      <button
        type="button"
        className={btn}
        title="Note callout"
        onClick={() => onInsert(":::note\n\n:::")}
      >
        note
      </button>
      <button
        type="button"
        className={btn}
        title="Warning callout"
        onClick={() => onInsert(":::warning\n\n:::")}
      >
        warn
      </button>
      <button
        type="button"
        className={btn}
        title="Spoiler (click-to-reveal)"
        onClick={() => onInsert(':::spoiler{title="Reveal"}\n\n:::')}
      >
        spoiler
      </button>
      <button
        type="button"
        className={btn}
        title="Redacted flag placeholder"
        onClick={() => onInsert("::flag[user]")}
      >
        flag
      </button>
      <button
        type="button"
        className={btn}
        title="YouTube embed (11-char video id)"
        onClick={() => onInsert("::youtube[VIDEO_ID]")}
      >
        youtube
      </button>

      <span className="mx-1 h-4 w-px bg-border" />

      <button
        type="button"
        className={btn}
        title="Upload an image"
        onClick={onUploadClick}
        disabled={uploading}
      >
        {uploading ? "uploading…" : "image ↑"}
      </button>
    </div>
  );
}
