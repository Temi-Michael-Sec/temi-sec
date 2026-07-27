import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBySlug, getAllPublished } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/seo";
import { PostShell } from "@/components/post/PostShell";
import { ArticleHeader } from "@/components/post/headers";

// ISR: rebuilt at most every 5 min. Phase 3's publish action will trigger
// on-demand revalidation for instant updates.
export const revalidate = 300;

export async function generateStaticParams() {
  const all = await getAllPublished();
  return all.filter((p) => p.type === "article").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "article") return {};
  return buildPostMetadata(post);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "article") notFound();
  return <PostShell post={post} header={<ArticleHeader post={post} />} />;
}
