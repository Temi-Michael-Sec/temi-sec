import type { Metadata } from "next";
import { getByType } from "@/lib/posts";
import { Listing } from "@/components/post/Listing";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildListingMetadata(
  "Security Policies",
  "GRC policy templates mapped to common frameworks, with the reasoning filled in so they're ready to adapt.",
  "/policies",
);

export default async function PoliciesIndex() {
  const posts = await getByType("policy");
  return (
    <Listing
      title="Security Policies"
      intro="GRC policy templates mapped to common frameworks, with the reasoning filled in so they're ready to adapt."
      promptPath="~/policies"
      posts={posts}
    />
  );
}
