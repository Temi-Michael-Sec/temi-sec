import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBySlug, staticSlugsForType } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/seo";
import { GlossaryPage } from "@/components/post/GlossaryPage";

export const revalidate = 300;

export function generateStaticParams() {
  return staticSlugsForType("glossary");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "glossary") return {};
  return buildPostMetadata(post);
}

export default async function GlossaryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "glossary") notFound();
  return <GlossaryPage post={post} />;
}
