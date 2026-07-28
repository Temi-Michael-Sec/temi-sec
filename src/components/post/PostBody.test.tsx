// @vitest-environment jsdom
import { StrictMode } from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PostBody } from "./PostBody";

/**
 * Tests the progressive enhancement PostBody does to the sanitized HTML — the
 * one place in Phase 2 that performs raw DOM surgery, so the most worth pinning
 * down. The HTML it receives is already sanitized at publish; these tests are
 * about the enhancement being correct and idempotent, not about XSS (that's
 * covered where the HTML is produced, in render.test.ts).
 */

afterEach(cleanup);

const SAMPLE = `
  <pre class="shiki"><code>nmap -sV target</code></pre>
  <div data-spoiler="true" data-spoiler-title="Solution steps"><p>step one</p></div>
  <div data-youtube-id="dQw4w9WgXcQ"></div>
`;

describe("PostBody enhancement", () => {
  it("adds a copy button inside each code block", () => {
    const { container } = render(<PostBody html={SAMPLE} />);
    const buttons = container.querySelectorAll("pre.shiki .code-copy");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toBe("copy");
  });

  it("converts a spoiler div into a native <details> with its title", () => {
    const { container } = render(<PostBody html={SAMPLE} />);
    const details = container.querySelector("details.spoiler");
    expect(details).not.toBeNull();
    expect(details?.querySelector("summary")?.textContent).toBe("Solution steps");
    // Original content is preserved inside the body, collapsed by default.
    expect(details?.querySelector(".spoiler-body")?.textContent).toContain(
      "step one",
    );
    expect((details as HTMLDetailsElement).open).toBe(false);
    // The original div is gone.
    expect(container.querySelector("div[data-spoiler]")).toBeNull();
  });

  it("turns a YouTube placeholder into a click-to-load facade, no iframe yet", () => {
    const { container } = render(<PostBody html={SAMPLE} />);
    const embed = container.querySelector(".yt-embed");
    expect(embed).not.toBeNull();
    expect(embed?.querySelector(".yt-facade")).not.toBeNull();
    // No third-party request until the reader clicks.
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("does not double-enhance under StrictMode (effect runs twice)", () => {
    // StrictMode double-invokes effects on mount — the exact scenario the
    // dataset.enhanced guard defends. Without it, every block gets two buttons.
    const { container } = render(
      <StrictMode>
        <PostBody html={SAMPLE} />
      </StrictMode>,
    );
    expect(container.querySelectorAll(".code-copy")).toHaveLength(1);
    expect(container.querySelectorAll("details.spoiler")).toHaveLength(1);
    expect(container.querySelectorAll(".yt-facade")).toHaveLength(1);
  });

  it("renders empty html without throwing", () => {
    const { container } = render(<PostBody html="" />);
    expect(container.querySelector(".post-body")).not.toBeNull();
  });
});

describe("PostBody interactions", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn() },
      configurable: true,
    });
  });

  it("copies the code text when the copy button is clicked", () => {
    const { container } = render(<PostBody html={SAMPLE} />);
    const btn = container.querySelector<HTMLButtonElement>(".code-copy")!;
    btn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("nmap -sV target");
    expect(btn.textContent).toBe("copied");
  });

  it("loads a youtube-nocookie iframe only after the facade is clicked", () => {
    const { container } = render(<PostBody html={SAMPLE} />);
    const facade = container.querySelector<HTMLButtonElement>(".yt-facade")!;
    facade.click();
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toContain(
      "youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
});
