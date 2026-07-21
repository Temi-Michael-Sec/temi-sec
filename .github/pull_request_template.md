<!--
The PR history is a deliverable on this project, not bookkeeping. /security
links back to the PRs that implemented each control, and people read them.
Write the reasoning, not just the change.
-->

## What

<!-- One or two sentences. What does this unit do? -->

## Why

<!-- The reasoning. For security-relevant units: what is the threat, and what
     does this control actually prevent? "Add rate limiting" is not an answer;
     "unauthenticated login endpoint allowed credential stuffing at line speed"
     is. -->

## Phase / unit

<!-- e.g. Phase 3 — `p3/session-jose`. See implementation.md. -->

## Merge gate

<!-- Copy the gate for this unit from implementation.md and tick it. -->

- [ ] Unit-specific gate met (state which, and how it was verified)

## Standard checks

- [ ] `tsc --noEmit` clean
- [ ] `eslint` clean
- [ ] `vitest run` green
- [ ] Preview deploy builds; the affected route renders
- [ ] No new `dangerouslySetInnerHTML` outside the CI allowlist
- [ ] No secret in a `NEXT_PUBLIC_*` variable

## Tried to break it

<!-- For any unit that enforces something: how did you attempt to bypass it?
     "Bypass it with curl" is the standing definition of done — checklist
     unticked but publish anyway, spoofed x-forwarded-for against the rate
     limit, direct POST past client-side validation. Record what you tried
     and what happened. -->
