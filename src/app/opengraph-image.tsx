import { ImageResponse } from "next/og";

export const alt = "temi.sec — security notes, CTF writeups, and a tool reference";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default Open Graph card for the whole site — the share preview for any page
 * that doesn't set its own `seo.ogImage`. Rebuilt from the brand: the `>_` mark
 * in teal on the dark ground, the wordmark, and the tagline.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0b",
          color: "#e4e4e7",
          padding: "80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "96px",
              height: "96px",
              borderRadius: "20px",
              background: "#18181b",
              color: "#2dd4bf",
              fontSize: "56px",
              fontWeight: 700,
            }}
          >
            {">_"}
          </div>
          <div style={{ fontSize: "56px", fontWeight: 600 }}>temi.sec</div>
        </div>

        <div
          style={{
            marginTop: "48px",
            fontSize: "44px",
            lineHeight: 1.25,
            maxWidth: "900px",
            color: "#e4e4e7",
          }}
        >
          Security notes, CTF writeups, and a tool reference that gets used.
        </div>

        <div style={{ marginTop: "32px", fontSize: "26px", color: "#71717a" }}>
          offensive & defensive security · written to teach
        </div>
      </div>
    ),
    { ...size },
  );
}
