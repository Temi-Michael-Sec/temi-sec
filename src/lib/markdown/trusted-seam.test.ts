import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./render";

/**
 * The `renderMarkdown(md, { trusted })` seam. Admin content (default) keeps the
 * prefix-free ids for clean deep links; the untrusted path restores
 * rehype-sanitize's DOM-clobbering `user-content-` prefix. Both must go through
 * the same sanitized pipeline. Guest content is not authored anywhere yet — this
 * just proves the switch is wired.
 */
describe("renderMarkdown trusted seam", () => {
  it("defaults to trusted: heading ids carry no user-content- prefix", async () => {
    const html = await renderMarkdown("## My Heading");
    expect(html).toContain('id="my-heading"');
    expect(html).not.toContain("user-content-");
  });

  it("trusted:false restores the user-content- clobber prefix", async () => {
    const html = await renderMarkdown("## My Heading", { trusted: false });
    expect(html).toContain("user-content-my-heading");
  });
});
