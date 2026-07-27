"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a post's stored, sanitized HTML and progressively enhances it.
 *
 * `bodyHtml` is produced by the publish pipeline (lib/markdown/render.ts): it is
 * already sanitized against an explicit allowlist and Shiki-highlighted, so it
 * is safe to inject. This is one of only two files permitted to use
 * `dangerouslySetInnerHTML` (enforced by the CI grep guard) — the other is the
 * comment renderer.
 *
 * The HTML renders on the server too (Next SSRs client components), so code,
 * callouts and prose are in the initial markup for crawlers and no-JS readers.
 * The enhancements below are the interactive layer only:
 *   - copy buttons on code blocks
 *   - spoilers converted to native <details> (collapsed, keyboard-accessible)
 *   - YouTube placeholders turned into click-to-load facades (no third-party
 *     request until the reader chooses to play)
 */
export function PostBody({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    addCopyButtons(root);
    enhanceSpoilers(root);
    enhanceYouTube(root);
  }, [html]);

  return (
    <div
      ref={ref}
      className={`post-body ${className ?? ""}`}
      // Safe: server-sanitized at publish time. See the file header.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function addCopyButtons(root: HTMLElement) {
  root.querySelectorAll<HTMLPreElement>("pre.shiki").forEach((pre) => {
    if (pre.dataset.enhanced) return; // idempotent (React strict mode double-runs)
    pre.dataset.enhanced = "true";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy";
    btn.textContent = "copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code")?.innerText ?? "";
      navigator.clipboard?.writeText(code);
      btn.textContent = "copied";
      window.setTimeout(() => (btn.textContent = "copy"), 1200);
    });
    pre.appendChild(btn);
  });
}

function enhanceSpoilers(root: HTMLElement) {
  root
    .querySelectorAll<HTMLDivElement>("div[data-spoiler]")
    .forEach((div) => {
      if (div.dataset.enhanced) return;
      div.dataset.enhanced = "true";

      const title = div.getAttribute("data-spoiler-title") || "Show";

      const details = document.createElement("details");
      details.className = "spoiler";

      const summary = document.createElement("summary");
      summary.textContent = title;

      const body = document.createElement("div");
      body.className = "spoiler-body";
      while (div.firstChild) body.appendChild(div.firstChild);

      details.append(summary, body);
      div.replaceWith(details);
    });
}

function enhanceYouTube(root: HTMLElement) {
  root
    .querySelectorAll<HTMLDivElement>("div[data-youtube-id]")
    .forEach((div) => {
      if (div.dataset.enhanced) return;
      div.dataset.enhanced = "true";

      const id = div.getAttribute("data-youtube-id") || "";
      // Validated 11-char id at parse time, but re-check before building a URL.
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;

      div.classList.add("yt-embed");
      const facade = document.createElement("button");
      facade.type = "button";
      facade.className = "yt-facade";
      facade.textContent = "▶ play video";
      facade.setAttribute("aria-label", "Play YouTube video");
      facade.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        // youtube-nocookie + no request until the reader opts in.
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
        iframe.title = "YouTube video";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.setAttribute("allowfullscreen", "true");
        facade.replaceWith(iframe);
      });
      div.appendChild(facade);
    });
}
