/**
 * Shared control styles for the admin forms, so every input/select/button reads
 * the same and there's one place to adjust the look. Terminal-flavoured to match
 * the rest of the site: mono labels, thin borders, teal focus ring.
 */

export const labelClass =
  "block font-mono text-xs uppercase tracking-wider text-faint";

export const inputClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm " +
  "text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export const helpClass = "mt-1 text-xs text-faint";

export const errorClass = "mt-1 text-xs text-crit";

export const buttonPrimary =
  "inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 " +
  "text-sm font-medium text-background transition-opacity hover:opacity-90 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const buttonGhost =
  "inline-flex items-center justify-center rounded-md border border-border " +
  "bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors " +
  "hover:border-accent disabled:cursor-not-allowed disabled:opacity-50";

export const buttonDanger =
  "inline-flex items-center justify-center rounded-md bg-crit px-4 py-2 " +
  "text-sm font-medium text-white transition-opacity hover:opacity-90 " +
  "disabled:cursor-not-allowed disabled:opacity-50";
