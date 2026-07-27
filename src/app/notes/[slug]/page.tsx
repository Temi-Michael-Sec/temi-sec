import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBySlug, staticSlugsForType } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/seo";
import { PostShell } from "@/components/post/PostShell";
import { NoteHeader } from "@/components/post/headers";

export const revalidate = 300;

export function generateStaticParams() {
  return staticSlugsForType("note");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "note") return {};
  return buildPostMetadata(post);
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post || post.type !== "note") notFound();
  // Notes are short — no TOC rail.
  return (
    <PostShell post={post} header={<NoteHeader post={post} />} showToc={false} />
  );
}
