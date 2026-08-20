import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";
import { buildListingMetadata } from "@/lib/seo";

export const metadata: Metadata = buildListingMetadata(
  "About",
  "Who's behind temi.sec, what I work with, and why the site is itself part of the portfolio.",
  "/about",
);

export default function AboutPage() {
  return <AboutContent />;
}
