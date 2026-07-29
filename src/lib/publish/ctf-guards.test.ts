import { describe, it, expect } from "vitest";
import { scanForFlags, evaluatePublishGuards } from "./ctf-guards";

describe("scanForFlags", () => {
  it("catches every platform format, case-insensitively", () => {
    const body = "intro\nHTB{abc}\nplain\nthm{x}\npicoCTF{y}\nflag{z}\nCTF{w}";
    expect(scanForFlags(body).map((h) => h.line)).toEqual([2, 4, 5, 6, 7]);
  });

  it("does not flag the ::flag directive (no braces)", () => {
    expect(scanForFlags("::flag[user] then ::flag[root]")).toHaveLength(0);
  });

  it("ignores prose that merely mentions a flag", () => {
    expect(scanForFlags("the flag is left as an exercise")).toHaveLength(0);
  });
});

describe("evaluatePublishGuards", () => {
  const clean = {
    type: "ctf" as const,
    body: "a clean writeup",
    platform: "tryhackme",
    retired: true,
    checklistAcceptedAt: new Date(),
  };

  it("passes a clean, retired writeup with the checklist confirmed", () => {
    expect(evaluatePublishGuards(clean).ok).toBe(true);
  });

  it("blocks a flag in the body and reports the line", () => {
    const r = evaluatePublishGuards({ ...clean, body: "oops HTB{real_flag}" });
    expect(r.ok).toBe(false);
    const block = r.blocks.find((b) => b.code === "flag-in-body");
    expect(block?.hits?.[0].line).toBe(1);
  });

  it("blocks an active HackTheBox machine", () => {
    const r = evaluatePublishGuards({
      ...clean,
      platform: "hackthebox",
      retired: false,
    });
    expect(r.blocks.some((b) => b.code === "active-machine")).toBe(true);
  });

  it("blocks unconfirmed retirement on HackTheBox (undefined)", () => {
    const r = evaluatePublishGuards({
      ...clean,
      platform: "hackthebox",
      retired: undefined,
    });
    expect(r.blocks.some((b) => b.code === "active-machine")).toBe(true);
  });

  it("blocks a missing checklist", () => {
    const r = evaluatePublishGuards({ ...clean, checklistAcceptedAt: null });
    expect(r.blocks.some((b) => b.code === "checklist-unconfirmed")).toBe(true);
  });

  it("applies no CTF blocks to other types (article may show flag{…})", () => {
    const r = evaluatePublishGuards({
      type: "article",
      body: "here is an example flag{demo}",
    });
    expect(r.ok).toBe(true);
  });
});
