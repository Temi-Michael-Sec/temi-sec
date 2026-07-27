import type { Metadata } from "next";
import { getByTag } from "@/lib/posts";
import { Listing } from "@/components/post/Listing";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildListingMetadata(
    `#${slug}`,
    `Posts tagged ${slug}.`,
    `/tags/${slug}`,
  );
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getByTag(slug);
  return (
    <Listing
      title={`#${slug}`}
      intro={`Everything tagged ${slug}, newest first.`}
      promptPath={`~/tags/${slug}`}
      posts={posts}
      emptyText={`No posts tagged ${slug} yet.`}
    />
  );
}
