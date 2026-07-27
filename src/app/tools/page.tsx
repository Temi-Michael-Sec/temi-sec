import type { Metadata } from "next";
import { getByType } from "@/lib/posts";
import { Listing } from "@/components/post/Listing";
import { buildListingMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildListingMetadata(
  "Tool Library",
  "Install steps and searchable cheatsheets for the tools worth keeping in muscle memory.",
  "/tools",
);

export default async function ToolsIndex() {
  const posts = await getByType("tool");
  return (
    <Listing
      title="Tool Library"
      intro="Install steps and searchable cheatsheets for the tools worth keeping in muscle memory."
      promptPath="~/tools"
      posts={posts}
    />
  );
}
