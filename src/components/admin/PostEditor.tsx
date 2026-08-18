"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { ContentType } from "@/lib/taxonomy";
import type { AdminPostDetail } from "@/lib/admin/posts-admin";
import {
  savePost,
  autosave,
  type PostFormState,
} from "@/lib/admin/post-actions";
import { TYPE_LABEL } from "@/lib/admin/field-schema";
import { BodyEditor } from "./BodyEditor";
import { MetaForm } from "./MetaForm";
import { PublishPanel } from "./PublishPanel";
import {
  labelClass,
  inputClass,
  helpClass,
  errorClass,
  buttonPrimary,
} from "./styles";

interface PostEditorProps {
  mode: "new" | "edit";
  type: ContentType;
  post?: AdminPostDetail;
}

const initialState: PostFormState = {};
const AUTOSAVE_DEBOUNCE_MS = 2500;

/** Serializes stored references back to "Title | URL" lines for editing. */
function referencesToText(
  refs?: { title: string; url: string }[],
): string {
  return (refs ?? []).map((r) => `${r.title} | ${r.url}`).join("\n");
}

export function PostEditor({ mode, type, post }: PostEditorProps) {
  const [state, action, saving] = useActionState(savePost, initialState);
  const errors = state.errors ?? {};

  // Autosave only existing DRAFTS: a new post has no id yet, and a published
  // post must not have edits go live on every keystroke — those need Save.
  const canAutosave = mode === "edit" && post?.status === "draft";
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [autosaveMsg, setAutosaveMsg] = useState("");
  const [, startAutosave] = useTransition();

  function scheduleAutosave() {
    if (!canAutosave) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const formEl = formRef.current;
      if (!formEl) return;
      const data = new FormData(formEl);
      startAutosave(async () => {
        setAutosaveMsg("Saving…");
        const res = await autosave(data);
        setAutosaveMsg(
          res.error ??
            (res.savedAt
              ? `Autosaved ${new Date(res.savedAt).toLocaleTimeString()}`
              : ""),
        );
      });
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_17rem]">
      <form
        ref={formRef}
        action={action}
        onChange={scheduleAutosave}
        className="space-y-6"
      >
        <input type="hidden" name="type" value={type} />
        {post && <input type="hidden" name="id" value={post.id} />}

        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">
            {mode === "new" ? "New" : "Edit"} {TYPE_LABEL[type]}
          </h1>
        </div>

        <div>
          <label htmlFor="title" className={labelClass}>
            Title <span className="text-crit">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={post?.title ?? ""}
            autoFocus={mode === "new"}
            className={inputClass}
          />
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="slug" className={labelClass}>
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              defaultValue={post?.slug ?? ""}
              className={`${inputClass} font-mono`}
            />
            <p className={helpClass}>Leave blank to generate from the title.</p>
            {errors.slug && <p className={errorClass}>{errors.slug}</p>}
          </div>
          <div>
            <label htmlFor="tags" className={labelClass}>
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={post?.tags.join(", ") ?? ""}
              className={inputClass}
            />
            <p className={helpClass}>Comma-separated.</p>
          </div>
        </div>

        <div>
          <label htmlFor="excerpt" className={labelClass}>
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt ?? ""}
            className={inputClass}
          />
          {errors.excerpt && <p className={errorClass}>{errors.excerpt}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="coverImageUrl" className={labelClass}>
              Cover image URL
            </label>
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              defaultValue={post?.coverImage?.url ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="coverImageAlt" className={labelClass}>
              Cover image alt text
            </label>
            <input
              id="coverImageAlt"
              name="coverImageAlt"
              type="text"
              defaultValue={post?.coverImage?.alt ?? ""}
              className={inputClass}
            />
          </div>
          <input
            type="hidden"
            name="coverImageWidth"
            defaultValue={post?.coverImage?.width ?? 0}
          />
          <input
            type="hidden"
            name="coverImageHeight"
            defaultValue={post?.coverImage?.height ?? 0}
          />
        </div>

        <div>
          <label htmlFor="references" className={labelClass}>
            References
          </label>
          <textarea
            id="references"
            name="references"
            rows={3}
            defaultValue={referencesToText(post?.references)}
            className={`${inputClass} font-mono`}
          />
          <p className={helpClass}>
            One per line — Title | URL. Shown as sources at the bottom of the post.
          </p>
        </div>

        <MetaForm type={type} values={post?.fields ?? {}} errors={errors} />

        <BodyEditor initialBody={post?.body ?? ""} onChange={scheduleAutosave} />

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <button type="submit" disabled={saving} className={buttonPrimary}>
            {saving ? "Saving…" : mode === "new" ? "Create draft" : "Save"}
          </button>
          {state.ok && state.message && (
            <span className="font-mono text-xs text-ok">{state.message}</span>
          )}
          {autosaveMsg && (
            <span className="font-mono text-xs text-faint">{autosaveMsg}</span>
          )}
        </div>
      </form>

      {mode === "edit" && post && (
        <PublishPanel
          id={post.id}
          type={post.type}
          status={post.status}
          slug={post.slug}
          lastReviewedAt={post.lastReviewedAt}
        />
      )}
    </div>
  );
}
