import { createHash } from "node:crypto";

import { buildSourceSetVersion, type SourceDocument } from "./evidence.ts";

export const GROUNDING_VERSIONS = {
  retrieval: "source-retrieval-1.0.0",
  prompt: "tutor-grounding-1.1.0",
  parser: "tutor-grounding-parser-1.1.0",
  protection: "assessment-protection-1.0.0",
} as const;

export type KnowledgeScope = "source" | "background" | "mixed" | "process";

export interface SourcePassage {
  id: string;
  readingId: string;
  filename: string;
  content: string;
  startOffset: number;
  endOffset: number;
  score: number;
}

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "because", "before", "being", "could",
  "does", "from", "have", "into", "more", "most", "only", "other", "should",
  "that", "their", "there", "these", "they", "this", "those", "through", "very",
  "what", "when", "where", "which", "while", "with", "would", "your",
]);

function terms(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .split(/\s+/)
        .filter((term) => term.length >= 4 && !STOP_WORDS.has(term))
    )
  );
}

export function splitSourcePassages(
  source: SourceDocument,
  maxLength = 1200
): SourcePassage[] {
  const passages: SourcePassage[] = [];
  let cursor = 0;

  while (cursor < source.content.length) {
    let end = Math.min(cursor + maxLength, source.content.length);
    if (end < source.content.length) {
      const paragraphBreak = source.content.lastIndexOf("\n\n", end);
      const sentenceBreak = source.content.lastIndexOf(". ", end);
      const candidate = Math.max(paragraphBreak, sentenceBreak);
      if (candidate > cursor + Math.floor(maxLength * 0.55)) {
        end = candidate + (candidate === sentenceBreak ? 1 : 0);
      }
    }

    const raw = source.content.slice(cursor, end);
    const leading = raw.search(/\S/);
    const content = raw.trim();
    if (content) {
      const startOffset = cursor + Math.max(leading, 0);
      const endOffset = startOffset + content.length;
      const id = createHash("sha256")
        .update(`${source.id}:${startOffset}:${content}`)
        .digest("hex")
        .slice(0, 20);
      passages.push({
        id,
        readingId: source.id,
        filename: source.filename,
        content,
        startOffset,
        endOffset,
        score: 0,
      });
    }
    cursor = Math.max(end, cursor + 1);
  }

  return passages;
}

export function retrieveRelevantPassages(
  query: string,
  sources: SourceDocument[],
  limit = 6
): SourcePassage[] {
  const queryTerms = terms(query);
  const all = sources.flatMap((source) => splitSourcePassages(source));
  if (all.length === 0) return [];

  const scored = all.map((passage) => {
    const passageTerms = new Set(terms(passage.content));
    const overlap = queryTerms.filter((term) => passageTerms.has(term));
    const phraseBonus = queryTerms.some(
      (term) => query.toLowerCase().includes(term) && passage.content.toLowerCase().includes(term)
    );
    return { ...passage, score: overlap.length * 2 + (phraseBonus ? 1 : 0) };
  });

  return scored
    .filter((passage) => passage.score > 0)
    .sort((a, b) => b.score - a.score || a.startOffset - b.startOffset)
    .slice(0, limit);
}

export function buildGroundedSourceContext(passages: SourcePassage[]): string {
  if (passages.length === 0) return "NO RELEVANT SOURCE PASSAGES WERE RETRIEVED.";

  return passages
    .map(
      (passage) =>
        `<source_passage id="${passage.id}" reading_id="${passage.readingId}" filename="${escapeAttribute(passage.filename)}">\n${passage.content}\n</source_passage>`
    )
    .join("\n\n");
}

function escapeAttribute(value: string): string {
  return value.replace(/[&"<>]/g, (character) => ({
    "&": "&amp;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;",
  })[character] ?? character);
}

export function parseSourceIds(response: string): string[] {
  const match = response.match(/\[SOURCE_IDS:\s*([^\]]+)\]/i);
  if (!match) return [];
  const value = match[1].trim();
  if (/^none$/i.test(value)) return [];
  return Array.from(
    new Set(value.split(",").map((id) => id.trim()).filter(Boolean))
  );
}

export function parseKnowledgeScope(response: string): KnowledgeScope | null {
  const match = response.match(
    /\[KNOWLEDGE_SCOPE:\s*(source|background|mixed|process)\]/i
  );
  return match ? (match[1].toLowerCase() as KnowledgeScope) : null;
}

export function validateSourceIds(
  ids: string[],
  passages: SourcePassage[],
  response?: string
): SourcePassage[] {
  const byId = new Map(passages.map((passage) => [passage.id, passage]));
  const resolved = ids.map((id) => byId.get(id)).filter((item): item is SourcePassage => Boolean(item));
  if (!response) return resolved;
  const responseTerms = new Set(terms(response));
  return resolved.filter((passage) => {
    const passageTerms = new Set(terms(passage.content));
    return Array.from(responseTerms).filter((term) => passageTerms.has(term)).length >= 2;
  });
}

export function responseRequiresGrounding(
  response: string,
  passages: SourcePassage[] = []
): boolean {
  const knowledgeScope = parseKnowledgeScope(response);
  const explicitlyAttributesToSource =
    /\b(the (reading|text|author|source) (says|argues|shows|defines|explains)|according to the (reading|text|source))\b/i.test(
      response
    );

  if (explicitlyAttributesToSource) return true;
  if (knowledgeScope === "source" || knowledgeScope === "mixed") return true;
  if (parseSourceIds(response).length > 0) return true;
  if (knowledgeScope === "background" || knowledgeScope === "process") return false;

  // Preserve conservative behavior if a model response omits the scope tag.
  const responseTerms = new Set(terms(response));
  const overlapsSource = passages.some((passage) => {
    const passageTerms = new Set(terms(passage.content));
    return Array.from(responseTerms).filter((term) => passageTerms.has(term)).length >= 2;
  });
  return /\[(DIRECT_ANSWER|FEEDBACK_TYPE|EXPERT_MODEL):/i.test(response) || overlapsSource;
}

export function buildUnsupportedSourceResponse(): string {
  return "I cannot verify that claim from the course materials available here. I can still help you test the idea using broader knowledge or identify what evidence would support it.\n\n**What claim are you trying to establish?**";
}

export function sourceSetVersion(sources: SourceDocument[]): string {
  return buildSourceSetVersion(sources);
}
