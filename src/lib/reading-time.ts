// src/lib/reading-time.ts

import { markdownToReadingText } from "@/lib/markdown/render";

export interface ReadingTimeOptions {
  wordsPerMinute?: number;
  cjkEnabled?: boolean;
}

const DEFAULT_WPM = 200;

/**
 * Estimates reading time in minutes from Markdown source.
 *
 * Code is counted, not stripped — a code-heavy CTF writeup genuinely takes
 * time to work through. That is why this uses `markdownToReadingText` (keeps
 * code) rather than `markdownToPlainText` (drops code, for meta descriptions
 * and excerpts). The stripping logic lives in one place, in render.ts.
 *
 * CJK (Chinese, Japanese, Korean) text has no spaces between words, so a naive
 * space-split would count a whole paragraph as one word. `Intl.Segmenter`
 * splits it into word-like units instead. It is widely supported now, but the
 * fallback keeps this working anywhere it is not.
 */
export function readingTime(
  markdown: string,
  options?: ReadingTimeOptions,
): number {
  const wpm = options?.wordsPerMinute ?? DEFAULT_WPM;
  const cjkEnabled = options?.cjkEnabled ?? true;

  const plainText = markdownToReadingText(markdown);

  if (!plainText) return 0;

  let wordCount: number;

  if (cjkEnabled && typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
    wordCount = 0;
    for (const segment of segmenter.segment(plainText)) {
      if (segment.isWordLike) wordCount++;
    }
  } else {
    wordCount = plainText.split(/\s+/).filter(Boolean).length;
  }

  return Math.max(1, Math.round(wordCount / wpm));
}
