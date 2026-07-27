import type { Metadata } from "next";
import { getByType } from "@/lib/posts";
import { Listing } from "@/components/post/Listing";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildListingMetadata(
  "CTF Writeups",
  "Retired machines and rooms, walked through with the reasoning behind each step — not just the commands.",
  "/ctf",
);

export default async function CtfIndex() {
  const posts = await getByType("ctf");
  return (
    <Listing
      title="CTF Writeups"
      intro="Retired machines and rooms, walked through with the reasoning behind each step — not just the commands."
      promptPath="~/ctf"
      posts={posts}
    />
  );
}
