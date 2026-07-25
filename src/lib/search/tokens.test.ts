import { describe, it, expect } from "vitest";
import { extractFlags, extractSearchTokens } from "./tokens";

describe("extractFlags", () => {
  it("pulls flags out of a real nmap command", () => {
    expect(extractFlags("nmap -sC -sV -oN scan.txt 10.10.10.1")).toEqual([
      "-sC",
      "-sV",
      "-oN",
    ]);
  });

  it("captures long flags with internal dashes", () => {
    expect(extractFlags("nmap --min-rate 1000 --script vuln")).toEqual([
      "--min-rate",
      "--script",
    ]);
  });

  it("captures a trailing-dash flag like nmap's -p-", () => {
    expect(extractFlags("nmap -p- -sV target")).toEqual(["-p-", "-sV"]);
  });

  it("stops a flag at an equals sign", () => {
    expect(extractFlags("ffuf -w list.txt -u http://x/FUZZ -mc=200")).toEqual([
      "-w",
      "-u",
      "-mc",
    ]);
  });

  it("does not treat a negative number as a flag", () => {
    expect(extractFlags("seq -5 10")).toEqual([]);
  });

  it("does not treat a bare dash or double dash as a flag", () => {
    expect(extractFlags("cmd - -- foo")).toEqual([]);
  });

  it("returns nothing for a command with no flags", () => {
    expect(extractFlags("gobuster dir")).toEqual([]);
  });
});

describe("extractSearchTokens", () => {
  it("combines tool name and flags from the cheatsheet", () => {
    const tokens = extractSearchTokens({
      toolName: "nmap",
      cheatsheet: [
        { command: "nmap -sC -sV -oN scan.txt" },
        { command: "nmap -p- --min-rate 5000" },
      ],
    });
    expect(tokens).toContain("nmap");
    expect(tokens).toContain("-oN");
    expect(tokens).toContain("-sV");
    expect(tokens).toContain("-p-");
    expect(tokens).toContain("--min-rate");
  });

  it("preserves case so -sV and -sv stay distinct", () => {
    const tokens = extractSearchTokens({
      cheatsheet: [{ command: "nmap -sV -sv" }],
    });
    expect(tokens).toContain("-sV");
    expect(tokens).toContain("-sv");
  });

  it("de-duplicates a flag repeated across commands", () => {
    const tokens = extractSearchTokens({
      cheatsheet: [{ command: "nmap -sV a" }, { command: "nmap -sV b" }],
    });
    expect(tokens.filter((t) => t === "-sV")).toHaveLength(1);
  });

  it("includes glossary term and aliases", () => {
    const tokens = extractSearchTokens({
      term: "XSS",
      aliases: ["Cross-Site Scripting"],
    });
    expect(tokens).toContain("XSS");
    expect(tokens).toContain("Cross-Site Scripting");
  });

  it("pulls flags from install commands too", () => {
    const tokens = extractSearchTokens({
      toolName: "gobuster",
      installCommands: [{ command: "go install -v github.com/x/gobuster" }],
    });
    expect(tokens).toContain("-v");
  });

  it("drops empty and whitespace-only sources", () => {
    const tokens = extractSearchTokens({
      toolName: "   ",
      aliases: ["", "  "],
    });
    expect(tokens).toEqual([]);
  });
});
