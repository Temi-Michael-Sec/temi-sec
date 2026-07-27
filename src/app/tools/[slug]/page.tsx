import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBySlug, getAllPublished, getWriteupsUsingTool } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/post/ToolPage";

export const revalidate = 300;

export async function generateStaticParams() {
  const all = await getAllPublished();
  return all.filter((p) => p.type === "tool").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "tool") return {};
  return buildPostMetadata(post);
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "tool") notFound();
  const writeups = await getWriteupsUsingTool(slug);
  return <ToolPage post={post} writeups={writeups} />;
}
