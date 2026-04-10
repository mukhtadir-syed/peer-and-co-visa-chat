import fs from "node:fs";
import path from "node:path";

let cachedContext: string | null = null;

function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return "";
  }
}

export function loadVisaReferenceContext(): string {
  if (cachedContext) return cachedContext;

  const base = path.join(process.cwd(), "content", "uk-visitor-visa");
  const official = readFileSafe(path.join(base, "official-guidance.md"));
  const peerGuide = readFileSafe(path.join(base, "peer-guide.md"));

  cachedContext = [
    "## Official UK Visitor Guidance (primary)",
    official,
    "",
    "## Peer & Co Internal Guidance (secondary)",
    peerGuide,
  ]
    .filter(Boolean)
    .join("\n");

  return cachedContext;
}
