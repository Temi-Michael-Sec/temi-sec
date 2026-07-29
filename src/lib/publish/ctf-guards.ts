import type { ContentType } from "@/lib/taxonomy";

/**
 * CTF publishing compliance — the hard blocks (PLAN.md §8).
 *
 * Platforms like HackTheBox issue takedowns for writeups of *active* machines,
 * and flags are frequently user-specific, so publishing one enables cheating.
 * These rules exist precisely for the moment they are forgotten, so they are
 * enforced in the publish flow rather than left to the author's memory — and on
 * the server, never trusting a checkbox the client could skip.
 *
 * None of this is a substitute for the manual checklist (screenshots, prompts,
 * internal IPs): a scanner cannot read a flag baked into a PNG. See §8.
 */

// Flag formats swept out of the body. Case-insensitive on purpose — `htb{…}`
// leaks as surely as `HTB{…}`. The `::flag[label]` directive has no braces, so
// this never matches the legitimate redaction directive, only a real flag.
const FLAG_RE = /(?:HTB|THM|picoCTF|CTF|flag)\{[^}\n]{0,256}\}/i;

export interface FlagHit {
  /** 1-based line number, so the author can jump straight to it. */
  line: number;
  /** The offending line, trimmed — shown back to the author. */
  text: string;
}

/** Every line of `body` that contains something shaped like a CTF flag. */
export function scanForFlags(body: string): FlagHit[] {
  const hits: FlagHit[] = [];
  body.split("\n").forEach((raw, i) => {
    if (FLAG_RE.test(raw)) hits.push({ line: i + 1, text: raw.trim() });
  });
  return hits;
}

export interface PublishBlock {
  code: "flag-in-body" | "active-machine" | "checklist-unconfirmed";
  message: string;
  /** Present for `flag-in-body` — the specific line(s) to fix. */
  hits?: FlagHit[];
}

export interface GuardResult {
  ok: boolean;
  blocks: PublishBlock[];
}

/** The fields a publish guard needs. Kept minimal so it's trivial to test. */
export interface PublishGuardInput {
  type: ContentType;
  body: string;
  platform?: string;
  retired?: boolean;
  checklistAcceptedAt?: Date | null;
}

/**
 * Evaluates every hard block that applies to a post. Returns `{ ok: true }`
 * when publishing is permitted. All three CTF blocks only apply to `type:
 * "ctf"` — an article discussing CTF concepts is free to show a `flag{…}`
 * example, and the checklist/retirement rules are meaningless off a writeup.
 */
export function evaluatePublishGuards(post: PublishGuardInput): GuardResult {
  const blocks: PublishBlock[] = [];

  if (post.type === "ctf") {
    const hits = scanForFlags(post.body);
    if (hits.length > 0) {
      blocks.push({
        code: "flag-in-body",
        message:
          "The body contains what looks like a CTF flag. Redact it with the " +
          "::flag[…] directive or a spoiler before publishing.",
        hits,
      });
    }

    // Active HackTheBox machines may not have writeups published. `undefined`
    // (retirement never confirmed) is blocked too — see the model's note on why
    // `retired` is deliberately un-defaulted.
    if (post.platform === "hackthebox" && post.retired !== true) {
      blocks.push({
        code: "active-machine",
        message:
          "HackTheBox prohibits writeups for machines that are not retired. " +
          "Confirm the machine is retired before publishing.",
      });
    }

    if (!post.checklistAcceptedAt) {
      blocks.push({
        code: "checklist-unconfirmed",
        message:
          "The pre-publish checklist (screenshots, prompts, internal IPs, " +
          "tokens) must be confirmed before a CTF writeup can publish.",
      });
    }
  }

  return { ok: blocks.length === 0, blocks };
}
