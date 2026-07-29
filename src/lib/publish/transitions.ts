import type { PostStatus } from "@/models/Post";

/**
 * The post lifecycle as an explicit state machine.
 *
 * Today the DB enum is just `draft | published` and the only moves are publish
 * and unpublish — which could be two `if`s. It is a machine on purpose: it is
 * forward-seam #2 for guest submissions (a future phase), where the states grow
 * to include `in_review` and `rejected` and the legal moves multiply. Adding
 * those then is one entry per state here, and every caller that routes through
 * `applyTransition` inherits the new rules for free. Scattered `if`s would each
 * need finding and updating.
 *
 * The machine governs *state* only. Whether a given publish is *allowed* (CTF
 * flag sweep, checklist, retirement) is a separate concern — see ctf-guards.ts.
 */

export type PostAction = "publish" | "unpublish";

// from-state → action → to-state. Absent action = illegal from that state.
const TRANSITIONS: Record<
  PostStatus,
  Partial<Record<PostAction, PostStatus>>
> = {
  draft: { publish: "published" },
  published: { unpublish: "draft" },
};

/** The state an action moves to, or `null` if the action is illegal there. */
export function nextState(
  from: PostStatus,
  action: PostAction,
): PostStatus | null {
  return TRANSITIONS[from][action] ?? null;
}

/** Whether `action` is legal from `from`. */
export function canTransition(from: PostStatus, action: PostAction): boolean {
  return nextState(from, action) !== null;
}

/**
 * Applies a transition, returning the new state. Throws on an illegal move so a
 * bug surfaces loudly rather than silently leaving the post in a wrong state.
 */
export function applyTransition(
  from: PostStatus,
  action: PostAction,
): PostStatus {
  const to = nextState(from, action);
  if (to === null) {
    throw new Error(`Illegal transition: cannot ${action} a ${from} post.`);
  }
  return to;
}
