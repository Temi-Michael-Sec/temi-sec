/**
 * Two-path search query planner.
 *
 * A query is split into flag tokens and word tokens, and each is routed to the
 * path that can actually serve it:
 *
 *   - Flag tokens (`-oN`, `--script`)  → exact match on `searchTokens`.
 *     `$text` cannot serve these: the tokenizer eats the punctuation and a
 *     leading `-` is read as negation.
 *   - Word tokens (`port scanning`)    → `$text` over title/excerpt/body.
 *   - A single bare word (`nmap`)      → BOTH, because it might be a tool name
 *     sitting in `searchTokens` or a word sitting in prose.
 *
 * `$text` is deliberately never combined with other clauses in one filter —
 * MongoDB restricts where a `$text` expression may appear. Instead each clause
 * runs as its own query and the results are merged (see `mergeById`), which is
 * also what structure.md §2.14 specifies.
 */

/** A single Mongo filter fragment produced by the planner. */
export type SearchClause =
  | { searchTokens: string }
  | { $text: { $search: string } };

export type SearchStrategy = "token" | "text" | "both";

export interface SearchPlan {
  clauses: SearchClause[];
  strategy: SearchStrategy;
}

/** Same flag shape as extraction, anchored for a whole-token test. */
const IS_FLAG = /^--?[A-Za-z][\w-]*$/;

/**
 * Plans the queries for a raw search string. Returns `null` for an empty query
 * so the caller can short-circuit to "no results" rather than running a scan.
 */
export function planSearch(query: string): SearchPlan | null {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const flags = tokens.filter((t) => IS_FLAG.test(t));
  const words = tokens.filter((t) => !IS_FLAG.test(t));

  const clauses: SearchClause[] = flags.map((f) => ({ searchTokens: f }));

  if (words.length > 0) {
    // A lone bare word is ambiguous: it could be an exact tool name/alias in
    // searchTokens, or prose in the text index. Serve both.
    if (flags.length === 0 && words.length === 1) {
      clauses.push({ searchTokens: words[0] });
      clauses.push({ $text: { $search: words[0] } });
    } else {
      // When flags are present, the text clause uses ONLY the word tokens.
      // Leaving a flag in the $text string would negate it — exactly the trap
      // this whole design exists to avoid.
      clauses.push({ $text: { $search: words.join(" ") } });
    }
  }

  const hasToken = clauses.some((c) => "searchTokens" in c);
  const hasText = clauses.some((c) => "$text" in c);
  const strategy: SearchStrategy =
    hasToken && hasText ? "both" : hasToken ? "token" : "text";

  return { clauses, strategy };
}

/** Anything with a stringifiable `_id`. */
export interface Identified {
  _id: unknown;
}

/**
 * Merges result lists from multiple clauses into one, de-duplicated by `_id`.
 *
 * Order matters: the lists are concatenated as given and the first occurrence
 * of an id wins. Callers pass exact-token results before `$text` results, so a
 * precise flag/tool-name hit ranks above a fuzzy prose hit.
 */
export function mergeById<T extends Identified>(lists: T[][]): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const list of lists) {
    for (const item of list) {
      const key = String(item._id);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}
