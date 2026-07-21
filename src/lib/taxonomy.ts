/**
 * Controlled vocabulary — the single source of truth for every primary facet.
 *
 * One entry here drives: the admin picker, the facet landing page, that page's
 * <title> and meta description, filter chips, breadcrumbs, and the sitemap.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THESE ARE NOT FREE TEXT
 *
 * Free text fragments immediately. You write "Recon", then "recon", then
 * "Reconnaissance", and one category becomes three half-empty pages — which
 * breaks navigation and splits whatever SEO authority those pages had.
 *
 * `as const` plus the derived union types below means a typo'd slug is a
 * compile error, not a silently broken page.
 *
 * Free-text `tags[]` still exists on Post as a secondary layer, for labels
 * where fragmentation is harmless.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TO ADD A CATEGORY: add one entry. Everything else derives.
 *
 * The `blurb` is what makes a facet page a real landing page rather than a bare
 * list — it renders above the results and is the meta description. Write it for
 * a human arriving from a search engine, not as a label.
 */

export interface Facet {
  readonly slug: string;
  readonly label: string;
  readonly blurb: string;
}

// ─── Policy frameworks ───────────────────────────────────────────────────────

export const FRAMEWORKS = [
  {
    slug: "iso-27001",
    label: "ISO/IEC 27001",
    blurb:
      "Policy templates mapped to the ISO/IEC 27001 information security management standard, with notes on what each control is actually asking for.",
  },
  {
    slug: "nist-csf",
    label: "NIST CSF 2.0",
    blurb:
      "Templates aligned to the NIST Cybersecurity Framework 2.0 functions: Govern, Identify, Protect, Detect, Respond, Recover.",
  },
  {
    slug: "soc-2",
    label: "SOC 2",
    blurb:
      "Policies supporting SOC 2 Trust Services Criteria, aimed at the evidence an auditor will ask you to produce.",
  },
  {
    slug: "gdpr",
    label: "GDPR",
    blurb:
      "Data protection policies and records templates for GDPR obligations, including lawful basis and data subject rights.",
  },
  {
    slug: "pci-dss",
    label: "PCI DSS",
    blurb:
      "Templates for PCI DSS requirements around cardholder data environments, segmentation and access control.",
  },
  {
    slug: "general",
    label: "General",
    blurb:
      "Framework-agnostic security policies and checklists that apply regardless of which standard you are working toward.",
  },
] as const satisfies readonly Facet[];

// ─── CTF platforms ───────────────────────────────────────────────────────────

export const PLATFORMS = [
  {
    slug: "hackthebox",
    label: "Hack The Box",
    blurb:
      "Writeups for retired Hack The Box machines. Active machines are never published — HTB prohibits it, and the publish flow blocks it.",
  },
  {
    slug: "tryhackme",
    label: "TryHackMe",
    blurb:
      "Room walkthroughs from TryHackMe, covering the reasoning rather than just the commands.",
  },
  {
    slug: "picoctf",
    label: "picoCTF",
    blurb:
      "Solutions and explanations for picoCTF challenges — a good starting point if you are new to CTFs.",
  },
  {
    slug: "vulnhub",
    label: "VulnHub",
    blurb:
      "Boot-to-root walkthroughs for VulnHub virtual machines you can run locally.",
  },
  {
    slug: "other",
    label: "Other",
    blurb:
      "Writeups from one-off competitions, university CTFs and challenges that do not fit the main platforms.",
  },
] as const satisfies readonly Facet[];

// ─── CTF difficulty ──────────────────────────────────────────────────────────

export const DIFFICULTIES = [
  {
    slug: "easy",
    label: "Easy",
    blurb:
      "Boxes solvable with standard enumeration and a well-known exploit path. Good for building the habit of methodical recon.",
  },
  {
    slug: "medium",
    label: "Medium",
    blurb:
      "Boxes requiring chained steps, some pivoting, or a less obvious privilege escalation route.",
  },
  {
    slug: "hard",
    label: "Hard",
    blurb:
      "Boxes with custom exploitation, source review, or non-standard services where the path is not documented anywhere.",
  },
  {
    slug: "insane",
    label: "Insane",
    blurb:
      "Long multi-stage boxes. These writeups are as much about the dead ends as the solution.",
  },
] as const satisfies readonly Facet[];

// ─── CTF categories ──────────────────────────────────────────────────────────

export const CTF_CATEGORIES = [
  {
    slug: "web",
    label: "Web Exploitation",
    blurb:
      "Injection, authentication flaws, SSRF, deserialisation and the rest of the web attack surface.",
  },
  {
    slug: "crypto",
    label: "Cryptography",
    blurb:
      "Broken implementations, weak parameters and misused primitives — rarely breaking the maths itself.",
  },
  {
    slug: "forensics",
    label: "Forensics",
    blurb:
      "Disk images, memory dumps, packet captures and file carving. Reconstructing what happened from what was left.",
  },
  {
    slug: "pwn",
    label: "Binary Exploitation",
    blurb:
      "Memory corruption, ROP chains and heap exploitation against native binaries.",
  },
  {
    slug: "reversing",
    label: "Reverse Engineering",
    blurb:
      "Static and dynamic analysis of binaries to recover logic, keys or protocol details.",
  },
  {
    slug: "osint",
    label: "OSINT",
    blurb:
      "Open-source intelligence — finding what is already public and assembling it into something useful.",
  },
  {
    slug: "network",
    label: "Network",
    blurb:
      "Protocol abuse, pivoting, traffic analysis and attacks against network services.",
  },
] as const satisfies readonly Facet[];

// ─── Tool categories ─────────────────────────────────────────────────────────

export const TOOL_CATEGORIES = [
  {
    slug: "recon",
    label: "Reconnaissance",
    blurb:
      "Host discovery, port scanning, subdomain enumeration and fingerprinting — everything before you touch anything.",
  },
  {
    slug: "web",
    label: "Web Testing",
    blurb:
      "Proxies, fuzzers and scanners for testing web applications.",
  },
  {
    slug: "exploitation",
    label: "Exploitation",
    blurb:
      "Frameworks and payload generators for turning a finding into access.",
  },
  {
    slug: "post-exploitation",
    label: "Post-Exploitation",
    blurb:
      "Privilege escalation, persistence, credential access and lateral movement once you are on the box.",
  },
  {
    slug: "password",
    label: "Password Attacks",
    blurb:
      "Hash cracking, wordlist generation and credential spraying tooling.",
  },
  {
    slug: "forensics",
    label: "Forensics & Analysis",
    blurb:
      "Memory, disk and network analysis tooling for working out what happened.",
  },
  {
    slug: "defensive",
    label: "Defensive",
    blurb:
      "Detection, hardening, monitoring and blue-team tooling.",
  },
] as const satisfies readonly Facet[];

// ─── Operating systems (CTF) ─────────────────────────────────────────────────

export const OPERATING_SYSTEMS = [
  {
    slug: "linux",
    label: "Linux",
    blurb:
      "Writeups against Linux targets — service enumeration, SUID and capability abuse, cron and sudo misconfiguration, and container escapes.",
  },
  {
    slug: "windows",
    label: "Windows",
    blurb:
      "Writeups against Windows targets, including Active Directory: Kerberos attacks, ACL abuse, token impersonation and credential access.",
  },
  {
    slug: "other",
    label: "Other",
    blurb:
      "BSD, embedded systems, network appliances and anything else that is neither a standard Linux nor Windows host.",
  },
] as const satisfies readonly Facet[];

// ─── Content types ───────────────────────────────────────────────────────────

export const CONTENT_TYPES = [
  "article",
  "ctf",
  "tool",
  "policy",
  "note",
  "glossary",
] as const;

// ─── Derived types ───────────────────────────────────────────────────────────
//
// These are what make a typo a compile error. `FrameworkSlug` is the literal
// union "iso-27001" | "nist-csf" | ... , not `string`, so passing "iso27001"
// anywhere fails to typecheck.

export type FrameworkSlug = (typeof FRAMEWORKS)[number]["slug"];
export type PlatformSlug = (typeof PLATFORMS)[number]["slug"];
export type DifficultySlug = (typeof DIFFICULTIES)[number]["slug"];
export type CtfCategorySlug = (typeof CTF_CATEGORIES)[number]["slug"];
export type ToolCategorySlug = (typeof TOOL_CATEGORIES)[number]["slug"];
export type OperatingSystemSlug = (typeof OPERATING_SYSTEMS)[number]["slug"];
export type ContentType = (typeof CONTENT_TYPES)[number];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

/** Slugs only — for Mongoose enum validation and `generateStaticParams`. */
export function slugsOf<T extends readonly Facet[]>(
  facets: T,
): readonly T[number]["slug"][] {
  return facets.map((f) => f.slug) as readonly T[number]["slug"][];
}

/** Find a facet by slug. Returns undefined so callers can `notFound()`. */
export function facetBySlug<T extends readonly Facet[]>(
  facets: T,
  slug: string,
): T[number] | undefined {
  return facets.find((f) => f.slug === slug);
}

/** Human label for a slug, falling back to the slug so nothing renders blank. */
export function labelOf<T extends readonly Facet[]>(
  facets: T,
  slug: string,
): string {
  return facetBySlug(facets, slug)?.label ?? slug;
}

export const FRAMEWORK_SLUGS = slugsOf(FRAMEWORKS);
export const PLATFORM_SLUGS = slugsOf(PLATFORMS);
export const DIFFICULTY_SLUGS = slugsOf(DIFFICULTIES);
export const CTF_CATEGORY_SLUGS = slugsOf(CTF_CATEGORIES);
export const TOOL_CATEGORY_SLUGS = slugsOf(TOOL_CATEGORIES);
export const OPERATING_SYSTEM_SLUGS = slugsOf(OPERATING_SYSTEMS);
