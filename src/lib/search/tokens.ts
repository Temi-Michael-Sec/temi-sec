/**
 * Search-token extraction.
 *
 * Populates `Post.searchTokens` at publish time. This is the exact-match half
 * of search, and it exists because MongoDB's `$text` index cannot handle
 * command syntax:
 *
 *   - The tokenizer strips punctuation, so `-oN`, `--script` and `-p-` never
 *     survive as indexable terms.
 *   - A leading `-` in a `$text` query means *negation* — `$text: "-oN"` asks
 *     for documents that EXCLUDE "oN".
 *
 * So flags and command fragments are extracted here and stored verbatim in a
 * plain multikey-indexed array, queried by equality. See structure.md §2.14.
 */

/**
 * Matches a command-line flag: one or two leading dashes, then a letter, then
 * word characters or dashes. Deliberately the same expression documented in
 * structure.md §2.14.
 *
 *   -sV   --script   -p-   --min-rate   -oN
 *
 * Does NOT match `-5`, `--`, or a bare `-`, none of which are flags.
 */
const FLAG_PATTERN = /(?:^|\s)(--?[A-Za-z][\w-]*)/g;

/** Extracts every flag from a single command string, in order, with duplicates. */
export function extractFlags(command: string): string[] {
  const flags: string[] = [];
  for (const match of command.matchAll(FLAG_PATTERN)) {
    flags.push(match[1]);
  }
  return flags;
}

/** The subset of a Post's fields that contribute search tokens. */
export interface TokenSource {
  toolName?: string;
  aliases?: string[];
  term?: string;
  cheatsheet?: { command: string }[];
  installCommands?: { command: string }[];
}

/**
 * Builds the `searchTokens` array for a post.
 *
 * Case is preserved on purpose: nmap's `-sV` and `-sv` are different flags, so
 * lower-casing here would conflate them. (The query side inherits the same
 * case-sensitivity — see the finding recorded in query.ts.)
 *
 * Order is preserved with a Set so the first occurrence wins and duplicates
 * collapse. Empty and whitespace-only tokens are dropped.
 */
export function extractSearchTokens(source: TokenSource): string[] {
  const tokens = new Set<string>();

  const add = (value: string | undefined) => {
    const trimmed = value?.trim();
    if (trimmed) tokens.add(trimmed);
  };

  add(source.toolName);
  add(source.term);
  source.aliases?.forEach(add);

  for (const { command } of source.cheatsheet ?? []) {
    extractFlags(command).forEach((f) => tokens.add(f));
  }
  for (const { command } of source.installCommands ?? []) {
    extractFlags(command).forEach((f) => tokens.add(f));
  }

  return [...tokens];
}
