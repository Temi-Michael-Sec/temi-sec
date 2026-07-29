// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PostBody } from "./PostBody";

/**
 * The live editor preview reuses PostBody but feeds it a NEW html string on
 * every (debounced) edit — unlike a published page, where html is fixed. These
 * pin down that enhancement survives an html change, the scenario that made a
 * YouTube embed vanish when the author typed a new line after it.
 */
afterEach(cleanup);

const yt = (extra = "") =>
  `<div data-youtube-id="dQw4w9WgXcQ"></div>${extra}`;

describe("PostBody re-enhancement on html change", () => {
  it("keeps the YouTube facade after the html prop changes", () => {
    const { container, rerender } = render(<PostBody html={yt()} />);
    expect(container.querySelector(".yt-facade")).not.toBeNull();

    // The author adds a new line → server returns different html.
    rerender(<PostBody html={yt("<p>next line</p>")} />);
    expect(container.querySelector(".yt-facade")).not.toBeNull();
  });

  it("keeps a code copy button after the html prop changes", () => {
    const code = (n: number) =>
      `<pre class="shiki"><code>line ${n}</code></pre>`;
    const { container, rerender } = render(<PostBody html={code(1)} />);
    expect(container.querySelector(".code-copy")).not.toBeNull();

    rerender(<PostBody html={code(2)} />);
    expect(container.querySelector(".code-copy")).not.toBeNull();
  });
});
