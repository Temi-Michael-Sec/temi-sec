"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ContentType } from "@/lib/taxonomy";
import type { PostStatus } from "@/models/Post";
import { postHref } from "@/lib/routes";
import { formatDate } from "@/lib/format";
import { fireConfetti } from "@/lib/confetti";
import {
  publish,
  unpublish,
  markReviewedAction,
  remove,
  type PublishState,
} from "@/lib/admin/post-actions";
import { buttonPrimary, buttonGhost } from "./styles";
import { ConfirmDialog } from "./Modal";

/**
 * The lifecycle controls for a saved post. Publish runs the server-side guards
 * and, on a hard block, shows exactly which lines/rules to fix. For a CTF the
 * pre-publish checklist must be confirmed here — that confirmation is what
 * records `checklistAcceptedAt`, which the guard then requires.
 */

interface PublishPanelProps {
  id: string;
  type: ContentType;
  status: PostStatus;
  slug: string;
  lastReviewedAt: string | null;
}

const CTF_CHECKLIST = [
  "Screenshots contain no flag values",
  "No personal username, email, or identifying shell prompt",
  "No internal IPs beyond the target's own",
  "No session tokens, cookies, or API keys in captured output",
  "Machine is retired / the room permits writeups",
];

const initialState: PublishState = {};

export function PublishPanel({
  id,
  type,
  status,
  slug,
  lastReviewedAt,
}: PublishPanelProps) {
  const [state, publishAction, publishing] = useActionState(
    publish,
    initialState,
  );

  // Which destructive action is awaiting confirmation, if any.
  const [confirming, setConfirming] = useState<null | "unpublish" | "delete">(
    null,
  );
  const publishBtnRef = useRef<HTMLButtonElement>(null);
  const unpublishFormRef = useRef<HTMLFormElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const celebrated = useRef(false);

  // Celebrate a successful publish once, bursting from the Publish button.
  useEffect(() => {
    if (state.ok && state.message === "Published." && !celebrated.current) {
      celebrated.current = true;
      const rect = publishBtnRef.current?.getBoundingClientRect();
      fireConfetti(
        rect ? { x: rect.left + rect.width / 2, y: rect.top } : undefined,
      );
    }
  }, [state]);

  return (
    <aside className="space-y-4 rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-faint">
          Status
        </span>
        <span
          className={
            status === "published"
              ? "font-mono text-xs text-ok"
              : "font-mono text-xs text-warn"
          }
        >
          {status}
        </span>
      </div>

      <a
        href={`/admin/posts/${id}/preview`}
        target="_blank"
        rel="noreferrer"
        className="block font-mono text-xs text-accent underline-offset-4 hover:underline"
      >
        preview ↗
      </a>

      {status === "published" && (
        <a
          href={postHref({ type, slug })}
          target="_blank"
          rel="noreferrer"
          className="block font-mono text-xs text-accent underline-offset-4 hover:underline"
        >
          view live ↗
        </a>
      )}

      {/* Guard blocks — why a publish was refused. */}
      {state.blocks && state.blocks.length > 0 && (
        <div className="space-y-2 rounded border border-crit/40 bg-crit/5 p-3">
          <p className="font-mono text-xs font-semibold text-crit">
            Publish blocked:
          </p>
          {state.blocks.map((block) => (
            <div key={block.code} className="text-xs text-foreground">
              <p>{block.message}</p>
              {block.hits && (
                <ul className="mt-1 space-y-0.5 font-mono text-faint">
                  {block.hits.map((hit) => (
                    <li key={hit.line}>
                      line {hit.line}: <span className="text-crit">{hit.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {state.ok && state.message && (
        <p className="font-mono text-xs text-ok">{state.message}</p>
      )}

      {status === "draft" ? (
        <form action={publishAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          {type === "ctf" && (
            <div className="space-y-2 rounded border border-border p-3">
              <p className="font-mono text-xs text-faint">Pre-publish checklist</p>
              <ul className="space-y-1 text-xs text-muted">
                {CTF_CHECKLIST.map((item) => (
                  <li key={item}>— {item}</li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  name="confirmChecklist"
                  className="h-4 w-4 accent-accent"
                />
                I confirm every item above.
              </label>
            </div>
          )}
          <button
            ref={publishBtnRef}
            type="submit"
            disabled={publishing}
            className={buttonPrimary}
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </form>
      ) : (
        <form ref={unpublishFormRef} action={unpublish}>
          <input type="hidden" name="id" value={id} />
          <button
            type="button"
            onClick={() => setConfirming("unpublish")}
            className={buttonGhost}
          >
            Unpublish
          </button>
        </form>
      )}

      {status === "published" && type !== "ctf" && (
        <form action={markReviewedAction}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={buttonGhost}>
            Reviewed, still accurate
          </button>
          {lastReviewedAt && (
            <p className="mt-1 text-xs text-faint">
              Last reviewed {formatDate(lastReviewedAt)}
            </p>
          )}
        </form>
      )}

      <form ref={deleteFormRef} action={remove}>
        <input type="hidden" name="id" value={id} />
        <button
          type="button"
          onClick={() => setConfirming("delete")}
          className="text-xs text-faint underline-offset-4 hover:text-crit hover:underline"
        >
          delete post
        </button>
      </form>

      <ConfirmDialog
        open={confirming === "unpublish"}
        title="Unpublish this post?"
        message="It will be taken off the live site and revert to a draft. You can publish it again later."
        confirmLabel="Unpublish"
        tone="danger"
        onConfirm={() => {
          setConfirming(null);
          unpublishFormRef.current?.requestSubmit();
        }}
        onCancel={() => setConfirming(null)}
      />

      <ConfirmDialog
        open={confirming === "delete"}
        title="Delete this post permanently?"
        message="This can't be undone — the post and its content are removed from the database for good."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setConfirming(null);
          deleteFormRef.current?.requestSubmit();
        }}
        onCancel={() => setConfirming(null)}
      />
    </aside>
  );
}
