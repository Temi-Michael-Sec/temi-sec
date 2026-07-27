import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBySlug, staticSlugsForType } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/seo";
import { PostShell } from "@/components/post/PostShell";
import { CtfHeader } from "@/components/post/headers";

export const revalidate = 300;

export function generateStaticParams() {
  return staticSlugsForType("ctf");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "ctf") return {};
  return buildPostMetadata(post);
}

export default async function CtfPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "ctf") notFound();
  // CTF writeups are point-in-time records — no freshness banner.
  return (
    <PostShell post={post} header={<CtfHeader post={post} />} showStale={false} />
  );
}
