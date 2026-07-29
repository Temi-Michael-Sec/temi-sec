import { describe, it, expect } from "vitest";
import { canTransition, nextState, applyTransition } from "./transitions";

describe("post lifecycle transitions", () => {
  it("draft → published on publish", () => {
    expect(nextState("draft", "publish")).toBe("published");
    expect(canTransition("draft", "publish")).toBe(true);
    expect(applyTransition("draft", "publish")).toBe("published");
  });

  it("published → draft on unpublish", () => {
    expect(nextState("published", "unpublish")).toBe("draft");
    expect(applyTransition("published", "unpublish")).toBe("draft");
  });

  it("rejects illegal moves", () => {
    expect(nextState("published", "publish")).toBeNull();
    expect(canTransition("draft", "unpublish")).toBe(false);
    expect(() => applyTransition("published", "publish")).toThrow(/Illegal/);
    expect(() => applyTransition("draft", "unpublish")).toThrow(/Illegal/);
  });
});
