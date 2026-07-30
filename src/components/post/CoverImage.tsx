import type { CoverImage as CoverImageData } from "@/models/Post";

/**
 * Renders a post's cover image below the header.
 *
 * A plain <img>, not next/image, on purpose: the URL is a Cloudinary asset and
 * the stored width/height can be 0 for a cover entered by URL in the editor
 * (next/image would reject that). Sized to preserve the image's own proportions
 * — natural size, capped at the column width and a sane max height — so a wide
 * banner and a small logo both look right without stretching or cropping.
 */
export function CoverImage({ image }: { image?: CoverImageData | null }) {
  if (!image?.url) return null;
  return (
    <figure className="mt-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className="max-h-[26rem] max-w-full rounded-[var(--radius)] border border-border"
      />
    </figure>
  );
}
