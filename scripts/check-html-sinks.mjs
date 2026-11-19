#!/usr/bin/env node
/**
 * Fails (exit 1) if a raw-HTML sink appears in src/ outside its allowlist.
 *
 * Runs in two places from this ONE file, so the checks can't drift apart:
 *   - CI (.github/workflows/ci.yml)
 *   - every `npm run build`, via the "prebuild" script — which is what makes a
 *     Vercel deploy fail too, since Vercel's Next.js build runs `npm run build`.
 *
 * Why it exists: the two worst spec defects in this project both lived at the
 * seam where trusted HTML is injected. Any new sink must be added to the
 * allowlist deliberately, in a change where someone has to justify it.
 *
 * Matching is a plain substring search, comments included — strict on purpose.
 * Rewording a comment is a cheap price for a check with no parser to fool.
 * Test files are skipped: they never ship to a browser.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const SOURCE_EXT = /\.(?:[cm]?[jt]sx?)$/;
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/;

/** Each sink, and the only files allowed to contain it. */
const SINKS = [
  {
    token: "dangerouslySetInnerHTML",
    allow: [
      "src/components/post/PostBody.tsx", // sanitized post HTML
      "src/components/comments/CommentItem.tsx", // escaped comment HTML (Phase 4)
    ],
  },
  // The DOM-level equivalents. Nothing in the app needs these today.
  { token: "innerHTML", allow: [] },
  { token: "outerHTML", allow: [] },
  { token: "insertAdjacentHTML", allow: [] },
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SOURCE_EXT.test(entry.name) && !TEST_FILE.test(entry.name)) {
      yield full;
    }
  }
}

const hits = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  const lines = readFileSync(file, "utf8").split("\n");
  for (const { token, allow } of SINKS) {
    if (allow.includes(rel)) continue;
    lines.forEach((line, i) => {
      if (line.includes(token)) hits.push(`${rel}:${i + 1}: ${token}`);
    });
  }
}

if (hits.length > 0) {
  console.error("✗ Raw-HTML sink outside the allowlist (scripts/check-html-sinks.mjs):");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log("✓ No unallowlisted raw-HTML sinks.");
