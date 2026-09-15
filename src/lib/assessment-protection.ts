export interface ProtectedAssessmentDocument {
  id: string;
  filename: string;
  content: string;
}

export interface ProtectionDecision {
  protected: boolean;
  assessmentIds: string[];
  triggerType: "none" | "answer_extraction" | "content_overlap";
  sourceConflict: boolean;
  rationale: string;
}

const EXTRACTION_PATTERNS = [
  /\b(give|tell|show|reveal|provide|write)\b.{0,32}\b(answer|answer key|solution|marking guide|rubric)\b/i,
  /\b(ignore|bypass|override|disregard)\b.{0,32}\b(instruction|protection|rule|restriction)\b/i,
  /\b(copy|quote|repeat|print|display)\b.{0,32}\b(assessment|exam|test|answer key|solution)\b/i,
  /\bwhat is the correct answer\b/i,
];

function significantTerms(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter((term) => term.length >= 5)
  );
}

export function assessProtectedRequest(
  learnerMessage: string,
  assessments: ProtectedAssessmentDocument[],
  sourcePassages: Array<{ content: string }> = []
): ProtectionDecision {
  if (assessments.length === 0) {
    return {
      protected: false,
      assessmentIds: [],
      triggerType: "none",
      sourceConflict: false,
      rationale: "No protected assessment material is configured.",
    };
  }

  const extraction = EXTRACTION_PATTERNS.some((pattern) => pattern.test(learnerMessage));
  const learnerTerms = significantTerms(learnerMessage);
  const overlaps = assessments.filter((assessment) => {
    const assessmentTerms = significantTerms(assessment.content);
    const shared = Array.from(learnerTerms).filter((term) => assessmentTerms.has(term));
    const requiredSharedTerms = learnerTerms.size <= 4 ? 2 : 3;
    return shared.length >= requiredSharedTerms && shared.length / Math.max(learnerTerms.size, 1) >= 0.3;
  });

  const protectedRequest = extraction || overlaps.length > 0;
  const sourceConflict = protectedRequest && sourcePassages.some((passage) => {
    const sourceTerms = significantTerms(passage.content);
    return Array.from(learnerTerms).filter((term) => sourceTerms.has(term)).length >= 2;
  });

  return {
    protected: protectedRequest,
    assessmentIds: (overlaps.length > 0 ? overlaps : assessments).map((item) => item.id),
    triggerType: extraction ? "answer_extraction" : overlaps.length > 0 ? "content_overlap" : "none",
    sourceConflict,
    rationale: protectedRequest
      ? sourceConflict
        ? "The request overlaps protected material and source material; protection takes precedence."
        : "The request may disclose or reconstruct protected assessment content."
      : "No protected-answer extraction or material overlap was detected.",
  };
}

export function buildProtectedCoachingResponse(): string {
  return "I can help you make progress, but I can’t write or reconstruct a protected assessment answer for you. I can clarify what the task requires, explain a concept with a different example, help you test a choice, or critique work you have already created.\n\n**Which part is blocking you, and what is your current reasoning or attempt so far?**";
}
