/**
 * Seed script — inserts one of every content type so Phase 2 has real content
 * to render, and proves the whole content engine works end to end against a
 * live database.
 *
 * Run it after setting MONGODB_URI in .env.local:
 *
 *   npm run seed
 *
 * It is idempotent: each post is upserted by slug, so re-running updates the
 * seeded content in place rather than creating duplicates. `views` and
 * `likeCount` are intentionally left out of the update so a re-seed never wipes
 * real engagement counts.
 *
 * Every post is put through the SAME derivation the publish flow will use —
 * renderMarkdown, extractToc, readingTime, extractSearchTokens — so a green run
 * here is a green run for the pipeline.
 *
 * The content lives in seed-data.ts (validated by seed-data.test.ts). This file
 * is only the run logic. Relative imports (not the @/ alias) so it runs under
 * tsx without needing path-alias resolution.
 */

import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Load .env.local the same way Next does. connectDB reads process.env at call
// time, so this only needs to run before seed() is invoked.
loadEnvConfig(process.cwd());

import { connectDB } from "../lib/db";
import { deriveContent } from "../lib/publish/derive";
import { seeds } from "./seed-data";

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error(
      "\n  MONGODB_URI is not set. Add it to .env.local (see .env.example) and retry.\n",
    );
    process.exit(1);
  }

  await connectDB();
  console.log("Connected. Seeding…\n");

  const now = new Date();
  const rows: { type: string; slug: string; minutes: number; toc: number }[] = [];

  for (const entry of seeds) {
    // The exact derivation the admin publish flow uses — one implementation, so
    // a re-seed can never disagree with what the editor would have produced.
    const derived = await deriveContent(entry.body, entry.tokenSource);

    const update = {
      ...entry.doc,
      body: entry.body,
      excerpt: entry.excerpt,
      ...derived,
      status: "published",
      publishedAt: now,
      lastReviewedAt: now,
      // CTF writeups need the pre-publish checklist confirmed; harmless on
      // other types.
      checklistAcceptedAt: now,
    };

    const saved = await entry.model.findOneAndUpdate(
      { slug: entry.doc.slug },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    rows.push({
      type: saved.type,
      slug: saved.slug,
      minutes: saved.readingTime,
      toc: saved.toc.length,
    });
  }

  console.table(rows);
  console.log(`\nSeeded ${rows.length} posts.`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("\nSeed failed:\n", err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
