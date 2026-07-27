import Link from "next/link";
import type { PostDetail } from "@/lib/posts";
import { Prompt } from "./Prompt";
import { formatDate, readingLabel } from "@/lib/format";
import { DifficultyChip } from "@/components/ui/Badge";
import {
  labelOf,
  PLATFORMS,
  DIFFICULTIES,
  OPERATING_SYSTEMS,
  CTF_CATEGORIES,
} from "@/lib/taxonomy";

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mt-3 max-w-[24ch] text-balance text-[clamp(1.9rem,4.5vw,2.25rem)] font-semibold leading-[1.12] tracking-[-0.02em]">
      {children}
    </h1>
  );
}

export function ArticleHeader({ post }: { post: PostDetail }) {
  return (
    <header className="border-b border-border pb-6 pt-12">
      <Prompt kind="post" path="~/blog" className="text-faint" />
      <Title>{post.title}</Title>
      <div className="mt-4 flex flex-wrap gap-4 font-mono text-[0.8125rem] text-faint">
        {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
        <span>{readingLabel(post.readingTime)}</span>
      </div>
    </header>
  );
}

export function NoteHeader({ post }: { post: PostDetail }) {
  return (
    <header className="border-b border-border pb-6 pt-12">
      <Prompt kind="post" path="~/notes" className="text-faint" />
      <Title>{post.title}</Title>
      <div className="mt-4 flex flex-wrap gap-4 font-mono text-[0.8125rem] text-faint">
        {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
        {post.source && <span>note · {post.source}</span>}
      </div>
    </header>
  );
}

export function CtfHeader({ post }: { post: PostDetail }) {
  return (
    <header className="border-b border-border pb-6 pt-12">
      <Prompt kind="post" path="~/ctf/hackthebox" className="text-faint" />
      <Title>{post.title}</Title>
      <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.8125rem]">
        <Field k="platform">{labelOf(PLATFORMS, post.platform ?? "")}</Field>
        <Field k="difficulty">
          {post.difficulty ? (
            <DifficultyChip difficulty={post.difficulty} />
          ) : (
            labelOf(DIFFICULTIES, post.difficulty ?? "")
          )}
        </Field>
        <Field k="os">{labelOf(OPERATING_SYSTEMS, post.os ?? "")}</Field>
        {post.categories && post.categories.length > 0 && (
          <Field k="category">
            {post.categories.map((c) => labelOf(CTF_CATEGORIES, c)).join(", ")}
          </Field>
        )}
        <Field k="read">{readingLabel(post.readingTime)}</Field>
      </dl>
      {post.toolsUsed && post.toolsUsed.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[0.8125rem] text-faint">
          <span>tools:</span>
          {post.toolsUsed.map((slug) => (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              className="text-accent underline-offset-2 hover:underline"
            >
              {slug}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="text-muted">{k}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
