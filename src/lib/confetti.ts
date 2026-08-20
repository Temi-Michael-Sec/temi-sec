import { gsap } from "gsap";

/**
 * A one-shot confetti burst, driven by GSAP's ticker (already a project
 * dependency — no extra package). Each piece is a DOM node given an initial
 * velocity; the ticker integrates simple gravity every frame until the pieces
 * fall off-screen, then the whole overlay removes itself.
 *
 * Honours prefers-reduced-motion (does nothing) and is a no-op on the server.
 */

const PIECE_COUNT = 110;
const GRAVITY = 1500; // px/s²

/** Colours pulled from the live theme so the burst matches light/dark. */
function themeColors(): string[] {
  const root = getComputedStyle(document.documentElement);
  const vars = ["--accent", "--t-ctf", "--t-tool", "--t-policy", "--t-note", "--ok"];
  const colors = vars
    .map((v) => root.getPropertyValue(v).trim())
    .filter(Boolean);
  return colors.length > 0 ? colors : ["#0d9488"];
}

interface Piece {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  ttl: number;
}

export function fireConfetti(origin?: { x: number; y: number }): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = themeColors();
  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight * 0.3;

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, () => {
    const el = document.createElement("div");
    const w = 6 + Math.random() * 6;
    const h = 8 + Math.random() * 8;
    el.style.cssText =
      `position:absolute;top:0;left:0;width:${w}px;height:${h}px;` +
      `background:${colors[(Math.random() * colors.length) | 0]};` +
      `border-radius:${Math.random() < 0.5 ? "1px" : "50%"};will-change:transform,opacity`;
    container.appendChild(el);

    // Explode outward in all directions, biased upward so it arcs and falls.
    const angle = Math.random() * Math.PI * 2;
    const speed = 300 + Math.random() * 500;
    return {
      el,
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 350,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 700,
      life: 0,
      ttl: 2.4 + Math.random() * 1.6,
    };
  });

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 50) / 1000; // clamp after a stall
    let alive = false;

    for (const p of pieces) {
      if (p.life >= p.ttl) continue;
      alive = true;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.life += dt;
      const fadeFrom = p.ttl - 0.6;
      const opacity = p.life > fadeFrom ? Math.max(0, (p.ttl - p.life) / 0.6) : 1;
      p.el.style.opacity = String(opacity);
      p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
    }

    if (!alive) {
      gsap.ticker.remove(tick);
      container.remove();
    }
  };

  gsap.ticker.add(tick);
}
