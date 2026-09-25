import type {
  TeachingBriefEvidenceMapItem,
  TeachingBriefEvidenceReference,
  TeachingBriefV1,
} from "./teaching-brief";
import { stripInlineMarkdown } from "./report-presentation.ts";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function sanitizeGeneratedHtml(value: string) {
  return value
    .replace(/<(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, "");
}

function renderList(values: string[], emptyMessage: string) {
  if (values.length === 0) return `<p class="muted">${escapeHtml(emptyMessage)}</p>`;
  return `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function countLabel(count: number, singular: string) {
  return count + " " + singular + (count === 1 ? "" : "s");
}

function renderReferences(references: TeachingBriefEvidenceReference[]) {
  if (references.length === 0) {
    return '<p class="muted">No direct quotation is attached to this item.</p>';
  }
  return references
    .slice(0, 4)
    .map(
      (reference) => `<blockquote>
        “${escapeHtml(stripInlineMarkdown(reference.quotedText))}”
        <footer>${escapeHtml(reference.learnerName ?? reference.sourceFilename ?? reference.citationType)} - ${escapeHtml(reference.relevanceRationale)}</footer>
      </blockquote>`
    )
    .join("");
}

function renderMapItem(item: TeachingBriefEvidenceMapItem) {
  return `<article class="map-item ${escapeHtml(item.classification)}">
    <div class="map-heading">
      <h3>${escapeHtml(item.label)}</h3>
      <span class="classification">${escapeHtml(item.classificationLabel)}</span>
    </div>
    <dl class="metrics">
      <div><dt>Learners</dt><dd>${item.learnerCount}</dd></div>
      <div><dt>Confidence</dt><dd>${escapeHtml(item.confidence.level)}</dd></div>
      <div><dt>Review state</dt><dd>${escapeHtml(item.reviewState.replaceAll("_", " "))}</dd></div>
      <div><dt>Coverage</dt><dd>${escapeHtml(item.opportunityCoverage.summary)}</dd></div>
    </dl>
    <p><strong>Confidence basis:</strong> ${escapeHtml(item.confidence.rationale)}</p>
    <div class="two-column">
      <section><h4>Contradictory evidence</h4>${renderList(item.contradictoryEvidence, "None recorded.")}</section>
      <section><h4>Missing evidence</h4>${renderList(item.missingEvidence, "None recorded.")}</section>
    </div>
    <h4>Inspect supporting evidence</h4>
    ${renderReferences(item.evidenceReferences)}
  </article>`;
}

function renderFacilitationPivots(pivots: TeachingBriefV1["facilitationPivots"]) {
  if (pivots.length === 0) {
    return '<p class="muted">No evidence-supported facilitation pivot was recorded for this brief.</p>';
  }
  return pivots
    .map(
      (pivot) => `<article class="pivot">
        <div class="map-heading">
          <h3>${escapeHtml(pivot.mode)} &middot; ${escapeHtml(pivot.scopeType)} scope</h3>
          <span class="classification">${escapeHtml(pivot.confidence)} confidence</span>
        </div>
        <p><strong>Observed:</strong> ${escapeHtml(pivot.observedCondition)}</p>
        <p><strong>Why:</strong> ${escapeHtml(pivot.rationale)}</p>
        <p><strong>Suggested move:</strong> ${escapeHtml(pivot.suggestedMove)}</p>
        ${pivot.suggestedPhrase ? `<blockquote>&ldquo;${escapeHtml(pivot.suggestedPhrase)}&rdquo;</blockquote>` : ""}
        <p><strong>Evidence scope:</strong> ${escapeHtml(pivot.evidenceScope)}</p>
        <p><strong>Escalate only when:</strong> ${escapeHtml(pivot.escalationCondition ?? "No automatic escalation is recommended.")}</p>
        <p><strong>Step back when:</strong> ${escapeHtml(pivot.releaseCondition)}</p>
        <p class="muted">${escapeHtml(pivot.reviewState.replaceAll("_", " "))} &middot; ${escapeHtml(pivot.createdBy)} &middot; rule-constrained mode selection</p>
      </article>`
    )
    .join("");
}

export function buildTeachingBriefExportHtml(input: {
  sessionName: string;
  narrativeHtml: string;
  brief: TeachingBriefV1;
}) {
  const { brief } = input;
  const generatedAt = new Date(brief.generatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
  const mapItems = brief.evidenceMap.items.map(renderMapItem).join("");
  const howToRead = brief.howToRead
    .map(
      (item) => `<li><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.explanation)}</li>`
    )
    .join("");
  const appendix = brief.evidenceAppendix
    .map(
      (reference) => `<li><strong>${escapeHtml(reference.learnerName ?? reference.sourceFilename ?? reference.citationType)}</strong><br>“${escapeHtml(stripInlineMarkdown(reference.quotedText))}”<br><span class="muted">${escapeHtml(reference.relevanceRationale)}</span></li>`
    )
    .join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(input.sessionName)} - Teaching Brief</title>
      <style>
        @page { size: A4; margin: 20mm 16mm 22mm; }
        * { box-sizing: border-box; }
        body { color: #292824; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.5; margin: 0; }
        h1, h2, h3, h4 { color: #292824; page-break-after: avoid; }
        h1 { font-family: Georgia, serif; font-size: 28pt; line-height: 1.05; margin: 0 0 8px; }
        h2 { border-bottom: 1px solid #d8d5ce; font-size: 16pt; margin-top: 28px; padding-bottom: 6px; }
        h3 { font-size: 12pt; margin: 0; }
        h4 { font-size: 9.5pt; margin: 12px 0 4px; text-transform: uppercase; }
        p, li { orphans: 3; widows: 3; }
        .eyebrow { color: #087f8c; font-size: 8.5pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
        .meta { color: #69665f; margin: 0; }
        .notice { background: #edf5f6; border-left: 5px solid #087f8c; margin: 22px 0; padding: 13px 16px; }
        .notice strong { display: block; margin-bottom: 3px; }
        .review { background: #fff7df; border: 1px solid #e9d399; padding: 10px 14px; }
        .how-to-read { columns: 2; column-gap: 30px; padding-left: 20px; }
        .how-to-read li { break-inside: avoid; margin-bottom: 8px; }
        .map-item { border: 1px solid #d8d5ce; border-left-width: 6px; margin: 15px 0; padding: 14px 16px; page-break-inside: avoid; }
        .pivot { background: #edf5f6; border-left: 5px solid #087f8c; margin: 15px 0; padding: 14px 16px; page-break-inside: avoid; }
        .pivot p { margin: 8px 0; }
        .evidence_suggests_ready { border-left-color: #4f7c46; }
        .evidence_suggests_gaps { border-left-color: #c28a20; }
        .evidence_suggests_review { border-left-color: #b34b40; }
        .map-heading { align-items: start; display: flex; gap: 12px; justify-content: space-between; }
        .classification { background: #efede7; border-radius: 999px; font-size: 8.5pt; font-weight: 700; padding: 3px 8px; white-space: nowrap; }
        .metrics { display: grid; gap: 8px; grid-template-columns: repeat(2, 1fr); margin: 12px 0; }
        .metrics div { background: #f6f5f2; padding: 7px 9px; }
        dt { color: #69665f; font-size: 8pt; text-transform: uppercase; }
        dd { margin: 1px 0 0; }
        .two-column { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; }
        blockquote { border-left: 3px solid #c9c5bc; color: #4e4b45; margin: 9px 0; padding-left: 11px; }
        blockquote footer { color: #77736b; font-size: 8.5pt; margin-top: 4px; }
        .narrative { border-top: 4px solid #292824; margin-top: 30px; }
        .appendix li { margin-bottom: 10px; }
        .muted { color: #77736b; }
        .metadata { background: #f6f5f2; font-size: 8.5pt; margin-top: 30px; padding: 12px 14px; }
      </style>
    </head>
    <body>
      <header>
        <p class="eyebrow">AI_demo · Instructor teaching brief</p>
        <h1>${escapeHtml(input.sessionName)}</h1>
        <p class="meta">${escapeHtml(brief.session.purposeLabel)} · ${countLabel(brief.session.learnerCount, "learner")} · ${countLabel(brief.session.exchangeCount, "exchange")} · Generated ${escapeHtml(generatedAt)} UTC</p>
      </header>
      <section class="notice">
        <strong>Formative use only</strong>
        ${escapeHtml(brief.formativeUse.statement)} ${escapeHtml(brief.formativeUse.aiGeneratedStatement)}<br>
        <strong>${escapeHtml(brief.formativeUse.gradingBoundary)}</strong>
      </section>
      <section class="review"><strong>Instructor review: ${escapeHtml(brief.instructorReview.state.replaceAll("_", " "))}</strong><br>${escapeHtml(brief.instructorReview.summary)}</section>
      <h2>How to read this brief</h2>
      <ul class="how-to-read">${howToRead}</ul>
      <h2>${escapeHtml(brief.evidenceMap.title)}</h2>
      ${mapItems || '<p class="muted">No mapped learning-outcome evidence is available yet.</p>'}
      <h2>Recommended facilitation pivots</h2>
      ${renderFacilitationPivots(brief.facilitationPivots)}
      <section class="narrative">
        <h2>AI-generated teaching synthesis</h2>
        ${sanitizeGeneratedHtml(input.narrativeHtml)}
      </section>
      <h2>Evidence appendix</h2>
      <ol class="appendix">${appendix || '<li>No direct evidence quotations are attached yet.</li>'}</ol>
      <footer class="metadata">
        Schema ${escapeHtml(brief.schemaVersion)} · Prompt ${escapeHtml(brief.promptVersion)} · Model ${escapeHtml(brief.modelProvider)}/${escapeHtml(brief.modelId)} · Review state ${escapeHtml(brief.instructorReview.state)}
      </footer>
    </body>
  </html>`;
}
