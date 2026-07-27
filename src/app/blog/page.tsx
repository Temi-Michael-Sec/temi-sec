import type { Metadata } from "next";
import { getByType } from "@/lib/posts";
import { Listing } from "@/components/post/Listing";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildListingMetadata(
  "Blog",
  "Long-form writing on offensive and defensive security — techniques, walkthroughs, and the occasional opinion.",
  "/blog",
);

export default async function BlogIndex() {
  const posts = await getByType("article");
  return (
    <Listing
      title="Blog"
      intro="Long-form writing on offensive and defensive security — techniques, walkthroughs, and the occasional opinion."
      promptPath="~/blog"
      posts={posts}
    />
  );
}
