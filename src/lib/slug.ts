/**
 * Slug generation.
 *
 * The output always matches the Post model's slug validator
 * (`^[a-z0-9]+(?:-[a-z0-9]+)*$`): lowercase alphanumerics separated by single
 * hyphens, no leading/trailing hyphen. Collision handling (appending -2, -3...)
 * lives in the data layer where it can query the DB - see posts-admin.ts.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD") // decompose accents: "e-acute" -> "e" + combining mark
    .replace(/[̀-ͯ]/g, "") // drop the combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics -> one hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/** Whether a string is already a valid post slug. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
