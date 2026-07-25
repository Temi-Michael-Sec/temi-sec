import { describe, it, expect } from "vitest";
import { extractSearchTokens } from "./tokens";
import { planSearch, mergeById, type SearchClause } from "./query";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SEARCH SPIKE — end-to-end validation of the searchTokens design.
 *
 * The claim to validate (structure.md §2.14, README): searching `-oN` finds the
 * nmap tool, while a plain MongoDB `$text` index cannot do that.
 *
 * There is no Atlas connection in this environment (`MONGODB_URI` is blank), so
 * this test stands up a tiny in-memory corpus whose two executors mimic exactly
 * what Mongo would do:
 *
 *   - `{ searchTokens: t }`   → equality against the multikey array (exact).
 *   - `{ $text: { $search } }` → tokenised, punctuation-stripped word overlap,
 *      AND honouring a leading `-` as negation — i.e. the real behaviour that
 *      makes `$text: "-oN"` useless. Modelling the failure is the whole point.
 *
 * If this passes, the design holds and the model can stay frozen.
 * ═════════════════════════════════════════════════════════════════════════════
 */

interface Doc {
  _id: string;
  title: string;
  body: string;
  searchTokens: string[];
}

const nmap: Doc = {
  _id: "nmap",
  title: "nmap",
  body: "Network mapper: host discovery and port scanning.",
  searchTokens: extractSearchTokens({
    toolName: "nmap",
    cheatsheet: [
      { command: "nmap -sC -sV -oN scan.txt 10.10.10.1" },
      { command: "nmap -p- --min-rate 5000 target" },
    ],
  }),
};

const gobuster: Doc = {
  _id: "gobuster",
  title: "gobuster",
  body: "Directory and DNS brute forcing.",
  searchTokens: extractSearchTokens({
    toolName: "gobuster",
    cheatsheet: [{ command: "gobuster dir -u URL -w list.txt -o out.txt" }],
  }),
};

const prose: Doc = {
  _id: "port-scanning-101",
  title: "Port scanning, explained",
  body: "How TCP and UDP port scanning works and why it is noisy.",
  searchTokens: [],
};

const CORPUS: Doc[] = [nmap, gobuster, prose];

/** Mimics Mongo executing one clause against the collection. */
function execute(clause: SearchClause): Doc[] {
  if ("searchTokens" in clause) {
    // Multikey equality: does the array contain this exact value?
    return CORPUS.filter((d) => d.searchTokens.includes(clause.searchTokens));
  }

  // $text: split on non-word characters (so `-oN` becomes the term `oN`, and a
  // leading `-` marks negation). This is a faithful-enough model of the token-
  // iser to reproduce the exact failure the token path exists to avoid.
  const raw = clause.$text.$search.split(/\s+/).filter(Boolean);
  const include: string[] = [];
  const exclude: string[] = [];
  for (const term of raw) {
    if (term.startsWith("-")) exclude.push(term.slice(1).replace(/\W/g, "").toLowerCase());
    else include.push(term.replace(/\W/g, "").toLowerCase());
  }

  return CORPUS.filter((d) => {
    const hay = `${d.title} ${d.body}`.toLowerCase();
    // Real Mongo: a $text search with no positive term returns nothing. This
    // is exactly why `-oN` (which tokenises to a lone negation) is useless via
    // $text — and why the token path has to exist.
    if (include.length === 0) return false;
    if (exclude.some((t) => t && hay.includes(t))) return false;
    return include.some((t) => t && hay.includes(t));
  });
}

/** Runs a full query the way the Phase 5 route handler will. */
function search(query: string): Doc[] {
  const plan = planSearch(query);
  if (!plan) return [];
  return mergeById(plan.clauses.map(execute));
}

describe("search spike — the design holds", () => {
  it("searching -oN finds nmap (the headline claim)", () => {
    const ids = search("-oN").map((d) => d._id);
    expect(ids).toEqual(["nmap"]);
  });

  it("proves WHY the token path is needed: raw $text for -oN fails", () => {
    // Same query down the path the design rejects. `-oN` tokenises to a
    // negation of "on", so nmap is not returned — and nothing useful is.
    const viaText = execute({ $text: { $search: "-oN" } });
    expect(viaText.map((d) => d._id)).not.toContain("nmap");
  });

  it("finds a tool by a long flag", () => {
    expect(search("--min-rate").map((d) => d._id)).toEqual(["nmap"]);
  });

  it("routes prose to the text path", () => {
    const ids = search("port scanning").map((d) => d._id);
    expect(ids).toContain("port-scanning-101");
  });

  it("finds a tool by its name through the both-path", () => {
    expect(search("nmap").map((d) => d._id)).toEqual(["nmap"]);
  });

  it("mixes a tool name and a flag without negating the word", () => {
    // "gobuster -w" — flag via token, name via text, merged.
    const ids = search("gobuster -w").map((d) => d._id);
    expect(ids).toContain("gobuster");
  });

  it("returns nothing for an unknown flag rather than everything", () => {
    expect(search("-zZ")).toEqual([]);
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FINDINGS — carried to Phase 5 (`p5/search`). The design is validated; these
 * are the sharp edges a live implementation must decide on.
 *
 * 1. CASE SENSITIVITY. Tokens are stored verbatim so nmap's `-sV` and `-sv`
 *    stay distinct, which means the token path is case-sensitive: a search for
 *    `-on` will NOT find `-oN`. Correct for flags, surprising for tool names
 *    (`Nmap` vs `nmap`). Phase 5 option: also store a lower-cased token and
 *    match case-insensitively for word tokens while keeping flags exact.
 *
 * 2. CHEATSHEET DESCRIPTIONS ARE NOT IN THE TEXT INDEX. The `$text` index
 *    covers title/excerpt/body only (one index per collection — see Post.ts).
 *    A tool's cheatsheet *descriptions* live in structured fields, so a prose
 *    search like "default scripts" will miss them unless the publish step also
 *    flattens descriptions into `body` (or a dedicated indexed field).
 *
 * 3. RELEVANCE ACROSS PATHS. Merge currently ranks all token hits above all
 *    text hits by concat order. Fine to start; if it feels blunt, blend the
 *    `$text` score in rather than hard-tiering.
 * ─────────────────────────────────────────────────────────────────────────────
 */
