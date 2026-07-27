import type { Metadata } from "next";
import { getByType } from "@/lib/posts";
import { Listing } from "@/components/post/Listing";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildListingMetadata(
  "Notes",
  "Short things learned along the way — a flag, a trick, a gotcha — that didn't need a full writeup.",
  "/notes",
);

export default async function NotesIndex() {
  const posts = await getByType("note");
  return (
    <Listing
      title="Notes"
      intro="Short things learned along the way — a flag, a trick, a gotcha — that didn't need a full writeup."
      promptPath="~/notes"
      posts={posts}
    />
  );
}
