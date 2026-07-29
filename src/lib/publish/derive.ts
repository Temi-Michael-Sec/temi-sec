// Relative imports (not the @/ alias) so the seed script can import this under
// `tsx`, which does not resolve tsconfig path aliases. See scripts/seed.ts.
import { renderMarkdown } from "../markdown/render";
import { extractToc } from "../markdown/toc";
import { readingTime } from "../reading-time";
import { extractSearchTokens, type TokenSource } from "../search/tokens";
import type { TocEntry } from "../../models/Post";

/**
 * The single derivation the publish flow and the seed script share.
 *
 * `Post.bodyHtml`, `toc`, `readingTime` and `searchTokens` are all *computed*
 * from `body` (and, for tools/glossary, a token source) rather than authored.
 * They must never drift from the source. Before this module the derivation
 * lived inline in `scripts/seed.ts`; the admin editor is the second writer, so
 * the sequence is extracted here and both callers use it. One implementation,
 * one place to change, no chance of the editor producing different HTML than a
 * re-seed would.
 *
 * Deliberately does NOT set `status`, `publishedAt` or `lastReviewedAt` — those
 * are lifecycle decisions owned by the state machine (see transitions.ts) and
 * the publish action, not content derivation.
 */
export interface DerivedContent {
  bodyHtml: string;
  toc: TocEntry[];
  readingTime: number;
  searchTokens: string[];
}

export async function deriveContent(
  body: string,
  tokenSource?: TokenSource,
): Promise<DerivedContent> {
  return {
    // Admin-authored, so the trusted schema — the default. A guest phase would
    // thread `{ trusted: false }` through here.
    bodyHtml: await renderMarkdown(body),
    toc: extractToc(body),
    readingTime: readingTime(body),
    searchTokens: tokenSource ? extractSearchTokens(tokenSource) : [],
  };
}
