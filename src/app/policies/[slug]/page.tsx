import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBySlug, staticSlugsForType } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/post/PolicyPage";

export const revalidate = 300;

export function generateStaticParams() {
  return staticSlugsForType("policy");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "policy") return {};
  return buildPostMetadata(post);
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "policy") notFound();
  return <PolicyPage post={post} />;
}
