import type { PostDetail } from "@/lib/posts";
import { getWriteupsUsingTool } from "@/lib/posts";
import { PostShell } from "@/components/post/PostShell";
import { ArticleHeader, CtfHeader, NoteHeader } from "@/components/post/headers";
import { ToolPage } from "@/components/post/ToolPage";
import { PolicyPage } from "@/components/post/PolicyPage";
import { GlossaryPage } from "@/components/post/GlossaryPage";

/**
 * Renders a post exactly as its public detail page would — same components,
 * same per-type layout — so the draft preview is faithful. This mirrors the six
 * `[slug]/page.tsx` files' component choice; the ONLY thing duplicated is that
 * small switch, not any rendering logic (that all lives in the shared
 * components below). Keep this in sync if a detail page's shell changes.
 */
export async function PostPreview({ post }: { post: PostDetail }) {
  switch (post.type) {
    case "article":
      return <PostShell post={post} header={<ArticleHeader post={post} />} />;
    case "ctf":
      return (
        <PostShell
          post={post}
          header={<CtfHeader post={post} />}
          showStale={false}
        />
      );
    case "note":
      return (
        <PostShell
          post={post}
          header={<NoteHeader post={post} />}
          showToc={false}
        />
      );
    case "policy":
      return <PolicyPage post={post} />;
    case "glossary":
      return <GlossaryPage post={post} />;
    case "tool": {
      const writeups = await getWriteupsUsingTool(post.slug);
      return <ToolPage post={post} writeups={writeups} />;
    }
    default:
      return null;
  }
}
