/**
 * Seed content — the sample posts, separated from the run logic in seed.ts so
 * they can be validated in a unit test (seed-data.test.ts) without a database.
 *
 * Bodies are built from single-quoted string arrays joined by newlines. Single
 * quotes let the Markdown contain backticks (code fences, inline code) with no
 * escaping.
 */

import mongoose from "mongoose";
import { Article, Ctf, Tool, Policy, Note, Glossary } from "../models/Post";
import type { TokenSource } from "../lib/search/tokens";

const articleBody = [
  "## Why this site exists",
  "",
  "A place to write up what I learn in security — CTF boxes, tool notes, and the",
  "occasional policy template. Everything here is meant to be **used**, not just",
  "read once.",
  "",
  ":::warning",
  "Only run the techniques described here against systems you own or are",
  "explicitly authorised to test.",
  ":::",
  "",
  "## How it is built",
  "",
  "Markdown is rendered through a sanitised pipeline, so a writeup can show a",
  "payload without ever executing it:",
  "",
  "```html",
  "<img src=x onerror=alert(1)>",
  "```",
  "",
  "That line is displayed as text.[^1]",
  "",
  "### Content types",
  "",
  "- Articles like this one",
  "- CTF writeups",
  "- A searchable tool reference",
  "- Policy templates",
  "",
  "[^1]: See the /security page for how the sanitiser is built.",
].join("\n");

const ctfBody = [
  "## Recon",
  "",
  "A standard scripted scan to start:",
  "",
  "```bash",
  "nmap -sC -sV -oN nmap/initial 10.10.10.10",
  "```",
  "",
  "## Foothold",
  "",
  "The web application allowed an upload whose extension check was trivially",
  "bypassable.",
  "",
  ':::spoiler{title="Solution steps"}',
  "1. Find the upload form",
  "2. Bypass the extension filter",
  "3. Catch a reverse shell",
  ":::",
  "",
  "## Root",
  "",
  "A misconfigured sudo rule made the final step short.",
  "",
  "User flag: ::flag[user]",
  "",
  "Root flag: ::flag[root]",
].join("\n");

const toolBody = [
  "[nmap](https://nmap.org) is usually the first tool out of the bag on a box —",
  "host discovery, port scanning, and service fingerprinting in one.",
  "",
  "## Common flags",
  "",
  "- `-sC` run the default script set",
  "- `-sV` version detection",
  "- `-oN` write normal output to a file",
  "",
  "See the cheatsheet below for the combinations worth memorising.",
].join("\n");

const policyBody = [
  "## Purpose",
  "",
  "This template defines how security incidents are detected, reported, and",
  "handled, so a response does not have to be improvised under pressure.",
  "",
  "## Scope",
  "",
  "Applies to all systems, data, and personnel within the organisation.",
  "",
  "## Phases",
  "",
  "1. Preparation",
  "2. Detection and analysis",
  "3. Containment, eradication, and recovery",
  "4. Post-incident review",
].join("\n");

const noteBody = [
  "TIL that `nmap` reads a newline-separated target list with `-iL targets.txt`.",
  "Handy when a client hands you a scope file and you would rather not paste a",
  "hundred hosts onto the command line.",
].join("\n");

const glossaryBody = [
  "Cross-site scripting (XSS) is a class of injection flaw where an attacker gets",
  "their script to run in another user's browser, in the context of a trusted",
  "site.",
  "",
  "## Types",
  "",
  "- Stored",
  "- Reflected",
  "- DOM-based",
].join("\n");

export interface SeedEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: mongoose.Model<any>;
  body: string;
  excerpt: string;
  doc: Record<string, unknown>;
  tokenSource?: TokenSource;
}

const nmapCheatsheet = [
  { command: "nmap -sC -sV -oN scan.txt <host>", description: "Default scripts + version detection" },
  { command: "nmap -p- --min-rate 5000 <host>", description: "Fast full port sweep" },
  { command: "nmap -iL targets.txt", description: "Scan a target list from a file" },
];

export const seeds: SeedEntry[] = [
  {
    model: Article,
    body: articleBody,
    excerpt:
      "A place to write up security work — CTF boxes, tool notes, and policy templates. Built to be used, not just read.",
    doc: {
      title: "Welcome to temi.sec",
      slug: "welcome-to-temi-sec",
      tags: ["meta", "about"],
    },
  },
  {
    model: Ctf,
    body: ctfBody,
    excerpt:
      "An easy Linux box: a bypassable upload leads to a foothold, and a loose sudo rule finishes the job.",
    doc: {
      title: "HTB: Example — an easy Linux upload box",
      slug: "htb-example-easy-linux",
      tags: ["htb", "web", "linux"],
      platform: "hackthebox",
      boxName: "Example",
      difficulty: "easy",
      os: "linux",
      categories: ["web"],
      toolsUsed: ["nmap"],
      retired: true, // required to publish a HackTheBox writeup
    },
  },
  {
    model: Tool,
    body: toolBody,
    excerpt:
      "Host discovery, port scanning, and service fingerprinting — the first tool on almost every box.",
    doc: {
      title: "nmap",
      slug: "nmap",
      tags: ["recon", "scanning"],
      toolName: "nmap",
      toolCategory: "recon",
      officialUrl: "https://nmap.org",
      platforms: ["Linux", "macOS", "Windows"],
      installCommands: [
        { platform: "Debian/Ubuntu", command: "sudo apt install nmap" },
        { platform: "macOS", command: "brew install nmap" },
      ],
      cheatsheet: nmapCheatsheet,
    },
    tokenSource: {
      toolName: "nmap",
      cheatsheet: nmapCheatsheet,
      installCommands: [
        { command: "sudo apt install nmap" },
        { command: "brew install nmap" },
      ],
    },
  },
  {
    model: Policy,
    body: policyBody,
    excerpt:
      "A NIST CSF-aligned incident response policy template, with the phases and scope filled in.",
    doc: {
      title: "Incident Response Policy",
      slug: "incident-response-policy",
      tags: ["grc", "incident-response"],
      framework: "nist-csf",
      version: "1.0",
      downloads: [],
    },
  },
  {
    model: Note,
    body: noteBody,
    excerpt: "nmap reads a newline-separated target list with -iL targets.txt.",
    doc: {
      title: "nmap reads a target list with -iL",
      slug: "nmap-target-list-il",
      tags: ["nmap", "til"],
      source: "Working through a client scope file",
    },
  },
  {
    model: Glossary,
    body: glossaryBody,
    excerpt:
      "An injection flaw where attacker-controlled script runs in another user's browser.",
    doc: {
      title: "XSS",
      slug: "xss",
      tags: ["web", "definitions"],
      term: "XSS",
      aliases: ["Cross-Site Scripting"],
      seeAlso: ["csrf", "content-security-policy"],
      shortDef:
        "An injection flaw where attacker-controlled script runs in another user's browser in the context of a trusted site.",
    },
    tokenSource: { term: "XSS", aliases: ["Cross-Site Scripting"] },
  },
];
