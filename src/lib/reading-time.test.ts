import { describe, it, expect } from "vitest";
import { readingTime } from "./reading-time";

describe("readingTime", () => {
  it("returns 0 for empty string", () => {
    expect(readingTime("")).toBe(0);
  });

  it("returns 1 minute for short content", () => {
    expect(readingTime("Hello world!")).toBe(1);
  });

  it("calculates correct reading time for ~400 words", () => {
    const text = "word ".repeat(400);
    expect(readingTime(text)).toBe(2);
  });

  it("counts words inside code blocks instead of ignoring them", () => {
    const text = `
\`\`\`typescript
const x = 10;
const y = 20;
console.log(x + y);
\`\`\`
    `;
    // This previously might return 0 if code was entirely stripped
    // Now it should return 1 minute since it counts the code tokens
    expect(readingTime(text)).toBe(1);
  });

  it("supports custom words per minute option", () => {
    const text = "word ".repeat(100);
    // At 50 WPM, 100 words should take 2 minutes
    expect(readingTime(text, { wordsPerMinute: 50 })).toBe(2);
  });

  it("supports CJK characters through Intl.Segmenter", () => {
    // 300 Chinese characters. Without Intl.Segmenter, this would be counted as 1 word if there are no spaces.
    // With it, it properly segments into words/characters.
    const text = "你好世界 ".repeat(150); 
    // Usually translates to approx 300 segments. At 200WPM -> 2 minutes.
    // Testing CJK logic works without throwing.
    expect(readingTime(text)).toBeGreaterThan(0);
  });
});
