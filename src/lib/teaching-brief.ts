import { createHash } from "node:crypto";
import { prisma } from "./db";
import { getHeatmapTitle, getSessionPurposeOption } from "./session-purpose";
import { uniqueNormalizedStrings } from "./report-presentation";

export const TEACHING_BRIEF_SCHEMA_VERSION = "teaching-brief-1.1.0";
export const TEACHING_BRIEF_PROMPT_VERSION = "teaching-brief-prompt-2.2.0";

export type EvidenceMapClassification =
  | "evidence_suggests_ready"
  | "evidence_suggests_gaps"
  | "evidence_suggests_review";

export type BriefReviewState =
  | "no_signals"
  | "unreviewed"
  | "partially_reviewed"
  | "reviewed";

export interface TeachingBriefEvidenceReference {
  id: string;
  signalId: string | null;
  learnerName: string | null;
  learnerSessionId: string | null;
  citationType: string;
  quotedText: string;
  sourceFilename: string | null;
  relevanceRationale: string;
}

export interface TeachingBriefEvidenceMapItem {
  id: string;
  label: string;
  classification: EvidenceMapClassification;
  classificationLabel: string;
  learnerCount: number;
  learnerSessionIds: string[];
  opportunityCoverage: {
    observedLearners: number;
    totalLearners: number;
    linkedQuestions: number;
    summary: string;
  };
  confidence: {
    level: "low" | "medium" | "high";
    rationale: string;
  };
  contradictoryEvidence: string[];
  missingEvidence: string[];
  reviewState: BriefReviewState;
  reviewSummary: string;
  signalIds: string[];
  evidenceReferences: TeachingBriefEvidenceReference[];
}

export interface TeachingBriefV1 {
  schemaVersion: typeof TEACHING_BRIEF_SCHEMA_VERSION;
  generatedAt: string;
  promptVersion: string;
  modelProvider: string;
  modelId: string;
  session: {
    id: string;
    name: string;
    purpose: string;
    purposeLabel: string;
    configFingerprint: string;
    sourceSetFingerprint: string;
    assessmentSetFingerprint: string;
    learnerCount: number;
    exchangeCount: number;
  };
  formativeUse: {
    statement: string;
    aiGeneratedStatement: string;
    gradingBoundary: string;
  };
  howToRead: Array<{ title: string; explanation: string }>;
  instructorReview: {
    state: BriefReviewState;
    summary: string;
    counts: Record<string, number>;
  };
  evidenceMap: {
    title: string;
    items: TeachingBriefEvidenceMapItem[];
  };
  suggestedTeachingMoves: Array<{
    id: string;
    whatToAddress: string;
    whyItMatters: string;
    evidence: string[];
    confidence: string;
    instructorAction: string | null;
  }>;
  facilitationPivots: Array<{
    id: string;
    mode: "observer" | "guide" | "conductor";
    recommendedMode: "observer" | "guide" | "conductor";
    scopeType: "learner" | "group" | "class";
    scopeIds: string[];
    triggerSignalIds: string[];
    evidenceScope: string;
    observedCondition: string;
    rationale: string;
    suggestedMove: string;
    suggestedPhrase: string | null;
    confidence: "low" | "medium" | "high";
    escalationCondition: string | null;
    releaseCondition: string;
    reviewState: string;
    createdBy: string;
  }>;
  strengths: TeachingBriefEvidenceMapItem[];
  followUps: TeachingBriefEvidenceMapItem[];
  misunderstandingPatterns: Array<{
    id: string;
    claim: string;
    learnerCount: number;
    learnerSessionIds: string[];
    confidence: string;
    reviewState: string;
    resolved: boolean;
    signalIds: string[];
    evidenceReferences: TeachingBriefEvidenceReference[];
  }>;
  perLearnerNotes: Array<{
    studentSessionId: string;
    learnerName: string;
    observedOutcomes: number;
    unresolvedMisunderstandings: number;
    summaryContested: boolean;
    note: string;
  }>;
  learningOutcomeEvidence: TeachingBriefEvidenceMapItem[];
  evidenceAppendix: TeachingBriefEvidenceReference[];
}

type BriefStats = {
  exchanges: number;
  studentsCount: number;
};

function safeParseArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [value];
  } catch {
    return value
      .split(/\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function statusScore(status: string) {
  const scores: Record<string, number | null> = {
    "0_no_submission": null,
    not_observed: null,
    "1_beginning": 1,
    emerging: 1,
    "2_developing": 2,
    insufficient_evidence: 2,
    "3_proficient": 3,
    meets: 3,
    "4_advanced": 4,
    exceeds: 4,
  };
  return scores[status] ?? null;
}

function confidenceRank(value: string) {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}

function reviewState(statuses: string[]): BriefReviewState {
  if (statuses.length === 0) return "no_signals";
  const provisional = statuses.filter((status) => status === "provisional").length;
  if (provisional === statuses.length) return "unreviewed";
  if (provisional > 0) return "partially_reviewed";
  return "reviewed";
}

function reviewSummary(state: BriefReviewState, count: number) {
  if (state === "no_signals") return "No consequential evidence signals are linked yet.";
  if (state === "unreviewed") return `${count} linked signal${count === 1 ? " is" : "s are"} still provisional.`;
  if (state === "partially_reviewed") return `Some of the ${count} linked signals have instructor review; others remain provisional.`;
  return `All ${count} linked signals have an instructor review state.`;
}

function classificationLabel(classification: EvidenceMapClassification) {
  if (classification === "evidence_suggests_ready") return "Evidence suggests ready";
  if (classification === "evidence_suggests_gaps") return "Evidence suggests gaps";
  return "Evidence suggests review";
}

function stableItemId(label: string) {
  return createHash("sha256").update(normalize(label)).digest("hex").slice(0, 12);
}

export function buildSessionConfigFingerprint(input: {
  name: string;
  description: string | null;
  courseContext: string | null;
  learningGoal: string | null;
  learningOutcomes: string | null;
  prerequisiteMap: string | null;
  sessionPurpose: string;
  stance: string;
  maxExchanges: number;
  planningOpeningQuestion: string | null;
  planningTaskInstructions: string | null;
  planningIntendedOutput: string | null;
  participationPlan: string;
  anticipatedPivots: string;
  planningVersion: string;
}) {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex")
    .slice(0, 24);
}

export function buildFileSetFingerprint(
  files: Array<{ id: string; filename: string; uploadedAt: Date }>
) {
  const stableFiles = files
    .map((file) => ({
      id: file.id,
      filename: file.filename,
      uploadedAt: file.uploadedAt.toISOString(),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return createHash("sha256")
    .update(JSON.stringify(stableFiles))
    .digest("hex")
    .slice(0, 24);
}

export function parseTeachingBrief(
  value: string | null | undefined
): TeachingBriefV1 | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<TeachingBriefV1>;
    return parsed.schemaVersion === TEACHING_BRIEF_SCHEMA_VERSION &&
      parsed.evidenceMap &&
      Array.isArray(parsed.evidenceMap.items)
      ? (parsed as TeachingBriefV1)
      : null;
  } catch {
    return null;
  }
}

export function hasStructuredTeachingBrief(value: string | null | undefined) {
  return parseTeachingBrief(value) !== null;
}

export async function buildStructuredTeachingBrief(
  sessionId: string,
  options: {
    generatedAt: Date;
    modelId: string;
    stats: BriefStats;
  }
): Promise<TeachingBriefV1> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      normalizedOutcomes: {
        where: { active: true },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      },
      evidenceQuestions: { where: { active: true } },
      evidenceSignals: {
        include: {
          studentSession: { select: { id: true, studentName: true } },
          citations: true,
          qualifications: true,
          learningOutcomeLinks: { include: { learningOutcome: true } },
          evidenceQuestionLinks: { include: { evidenceQuestion: true } },
          misconception: true,
        },
      },
      studentSessions: {
        include: {
          loAssessments: true,
          misconceptions: true,
        },
      },
      recommendations: { orderBy: { createdAt: "desc" } },
      facilitationRecommendations: {
        where: { reviewState: { not: "rejected" } },
        orderBy: [{ scopeType: "asc" }, { updatedAt: "desc" }],
      },
      readings: { select: { id: true, filename: true, uploadedAt: true } },
      assessments: { select: { id: true, filename: true, uploadedAt: true } },
    },
  });

  const activeSignals = session.evidenceSignals.filter(
    (signal: any) => signal.status !== "superseded" && signal.status !== "rejected"
  );
  const reviewCounts = session.evidenceSignals.reduce<Record<string, number>>(
    (counts: any, signal: any) => {
      counts[signal.status] = (counts[signal.status] ?? 0) + 1;
      return counts;
    },
    {}
  );
  const overallReviewState = reviewState(activeSignals.map((signal: any) => signal.status));

  const toReference = (
    signal: (typeof activeSignals)[number],
    citation: (typeof activeSignals)[number]["citations"][number]
  ): TeachingBriefEvidenceReference => ({
    id: citation.id,
    signalId: signal.id,
    learnerName: signal.studentSession?.studentName ?? null,
    learnerSessionId: signal.studentSession?.id ?? null,
    citationType: citation.citationType,
    quotedText: citation.quotedText,
    sourceFilename: citation.sourceFilename,
    relevanceRationale: citation.relevanceRationale,
  });

  const evidenceMapItems = session.normalizedOutcomes.map((outcome: any) => {
    const outcomeAssessments = session.studentSessions.flatMap((student: any) =>
      student.loAssessments
        .filter((assessment: any) => normalize(assessment.learningOutcome) === normalize(outcome.label))
        .map((assessment: any) => ({ assessment, student }))
    );
    const linkedSignals = activeSignals.filter((signal: any) =>
      signal.learningOutcomeLinks.some((link: any) => link.learningOutcomeId === outcome.id)
    );
    const learnerSessionIds = Array.from(
      new Set([
        ...outcomeAssessments.map(({ student }: any) => student.id),
        ...linkedSignals.flatMap((signal: any) =>
          signal.studentSessionId ? [signal.studentSessionId] : []
        ),
      ])
    );
    const scores = outcomeAssessments
      .map(({ assessment }: any) => statusScore(assessment.status))
      .filter((score: any): score is number => score !== null);
    const unresolved = linkedSignals.some(
      (signal: any) =>
        signal.signalType === "possible_misunderstanding" &&
        signal.status !== "rejected" &&
        !signal.misconception?.resolved
    );
    const averageScore =
      scores.length > 0
        ? scores.reduce((total: any, score: any) => total + score, 0) / scores.length
        : null;
    const classification: EvidenceMapClassification =
      averageScore === null || (averageScore < 2 && unresolved)
        ? "evidence_suggests_review"
        : averageScore >= 3 && !unresolved
          ? "evidence_suggests_ready"
          : "evidence_suggests_gaps";
    const confidenceValues = [
      ...outcomeAssessments.map(({ assessment }: any) => assessment.confidence),
      ...linkedSignals.map((signal: any) => signal.confidenceLevel),
    ];
    const confidenceLevel: "low" | "medium" | "high" =
      confidenceValues.length === 0
        ? "low"
        : confidenceValues.reduce((lowest, current) =>
              confidenceRank(current) < confidenceRank(lowest) ? current : lowest
            ) === "high"
          ? "high"
          : confidenceValues.some((value) => value === "low")
            ? "low"
            : "medium";
    const linkedQuestionIds = new Set(
      linkedSignals.flatMap((signal: any) =>
        signal.evidenceQuestionLinks.map((link: any) => link.evidenceQuestionId)
      )
    );
    const contradictions = uniqueNormalizedStrings(
      linkedSignals.flatMap((signal: any) => [
        ...signal.qualifications
          .filter((qualification: any) => qualification.kind === "contradictory_evidence")
          .map((qualification: any) => qualification.summary),
        ...safeParseArray(signal.contradictoryEvidence),
      ])
    );
    const missing = uniqueNormalizedStrings(
      linkedSignals.flatMap((signal: any) => [
        ...signal.qualifications
          .filter((qualification: any) => qualification.kind === "missing_evidence")
          .map((qualification: any) => qualification.summary),
        ...safeParseArray(signal.missingEvidence),
      ])
    );
    const itemReviewState = reviewState(linkedSignals.map((signal: any) => signal.status));
    const references = linkedSignals.flatMap((signal: any) =>
      signal.citations.map((citation: any) => toReference(signal, citation))
    );

    return {
      id: stableItemId(outcome.label),
      label: outcome.label,
      classification,
      classificationLabel: classificationLabel(classification),
      learnerCount: learnerSessionIds.length,
      learnerSessionIds,
      opportunityCoverage: {
        observedLearners: learnerSessionIds.length,
        totalLearners: session.studentSessions.length,
        linkedQuestions: linkedQuestionIds.size,
        summary: `${learnerSessionIds.length} of ${session.studentSessions.length} learners contributed relevant evidence across ${linkedQuestionIds.size} linked question${linkedQuestionIds.size === 1 ? "" : "s"}.`,
      },
      confidence: {
        level: confidenceLevel,
        rationale:
          confidenceValues.length === 0
            ? "No calibrated evidence has been recorded for this outcome yet."
            : `Conservative summary of ${confidenceValues.length} evidence confidence value${confidenceValues.length === 1 ? "" : "s"}; the lowest confidence governs the map item.`,
      },
      contradictoryEvidence: contradictions,
      missingEvidence: missing,
      reviewState: itemReviewState,
      reviewSummary: reviewSummary(itemReviewState, linkedSignals.length),
      signalIds: linkedSignals.map((signal: any) => signal.id),
      evidenceReferences: references,
    } satisfies TeachingBriefEvidenceMapItem;
  });

  const misunderstandingSignals = activeSignals.filter(
    (signal: any) =>
      signal.signalType === "possible_misunderstanding" && signal.status !== "rejected"
  );
  const misunderstandingPatterns = misunderstandingSignals.map((signal: any) => ({
    id: signal.id,
    claim: signal.claim,
    learnerCount: signal.studentSessionId ? 1 : 0,
    learnerSessionIds: signal.studentSessionId ? [signal.studentSessionId] : [],
    confidence: signal.confidenceLevel,
    reviewState: signal.status,
    resolved: signal.misconception?.resolved ?? false,
    signalIds: [signal.id],
    evidenceReferences: signal.citations.map((citation: any) => toReference(signal, citation)),
  }));

  const evidenceAppendix = Array.from(
    new Map(
      activeSignals
        .flatMap((signal: any) => signal.citations.map((citation: any) => toReference(signal, citation)))
        .map((reference: any) => [reference.id, reference])
    ).values()
  );

  const purpose = getSessionPurposeOption(session.sessionPurpose);
  return {
    schemaVersion: TEACHING_BRIEF_SCHEMA_VERSION,
    generatedAt: options.generatedAt.toISOString(),
    promptVersion: TEACHING_BRIEF_PROMPT_VERSION,
    modelProvider: "anthropic",
    modelId: options.modelId,
    session: {
      id: session.id,
      name: session.name,
      purpose: session.sessionPurpose,
      purposeLabel: purpose.label,
      configFingerprint: buildSessionConfigFingerprint({
        name: session.name,
        description: session.description,
        courseContext: session.courseContext,
        learningGoal: session.learningGoal,
        learningOutcomes: session.learningOutcomes,
        prerequisiteMap: session.prerequisiteMap,
        sessionPurpose: session.sessionPurpose,
        stance: session.stance,
        maxExchanges: session.maxExchanges,
        planningOpeningQuestion: session.planningOpeningQuestion,
        planningTaskInstructions: session.planningTaskInstructions,
        planningIntendedOutput: session.planningIntendedOutput,
        participationPlan: session.participationPlan,
        anticipatedPivots: session.anticipatedPivots,
        planningVersion: session.planningVersion,
      }),
      sourceSetFingerprint: buildFileSetFingerprint(session.readings),
      assessmentSetFingerprint: buildFileSetFingerprint(session.assessments),
      learnerCount: options.stats.studentsCount,
      exchangeCount: options.stats.exchanges,
    },
    formativeUse: {
      statement:
        "This teaching brief is formative. It summarizes evidence observed in this AI_demo session for instructor review.",
      aiGeneratedStatement:
        "Narrative synthesis is AI-generated; evidence-map counts, links, opportunity coverage, and review states are assembled from stored records.",
      gradingBoundary:
        "This brief is not a grade, diagnosis, prediction, or complete account of learner capability and must not be used as an automated summative assessment.",
    },
    howToRead: [
      {
        title: "Observed evidence",
        explanation: "Quotes, source passages, opportunities, and learner records are the inspectable evidence base.",
      },
      {
        title: "AI inference",
        explanation: "Claims and classifications are bounded interpretations of that evidence, not facts about a learner's stable ability.",
      },
      {
        title: "Confidence",
        explanation: "Confidence describes evidence support and consistency; low confidence means the instructor should seek more evidence.",
      },
      {
        title: "Instructor review",
        explanation: "Open linked signals to approve, revise, reject, supersede, or add context before consequential use.",
      },
    ],
    instructorReview: {
      state: overallReviewState,
      summary: reviewSummary(overallReviewState, activeSignals.length),
      counts: reviewCounts,
    },
    evidenceMap: {
      title: getHeatmapTitle(session.sessionPurpose),
      items: evidenceMapItems,
    },
    suggestedTeachingMoves: session.recommendations.slice(0, 8).map((recommendation: any) => ({
      id: recommendation.id,
      whatToAddress: recommendation.whatToAddress,
      whyItMatters: recommendation.whyItMatters,
      evidence: safeParseArray(recommendation.evidence),
      confidence: recommendation.confidence,
      instructorAction: recommendation.instructorAction,
    })),
    facilitationPivots: session.facilitationRecommendations.map((pivot: any) => {
      const scopeIds = safeParseArray(pivot.scopeIds);
      const storedTriggerSignalIds = safeParseArray(pivot.triggerSignalIds);
      const triggerSignalIds =
        storedTriggerSignalIds.length > 0
          ? storedTriggerSignalIds
          : [pivot.signalId];
      const recommendedMode = pivot.mode as "observer" | "guide" | "conductor";
      return {
        id: pivot.id,
        mode: (pivot.selectedMode || pivot.mode) as "observer" | "guide" | "conductor",
        recommendedMode,
        scopeType: pivot.scopeType as "learner" | "group" | "class",
        scopeIds,
        triggerSignalIds,
        evidenceScope:
          pivot.scopeType === "class"
            ? `${scopeIds.length} learners represented across ${triggerSignalIds.length} inspectable signals.`
            : `${triggerSignalIds.length} inspectable signal${triggerSignalIds.length === 1 ? "" : "s"} at ${pivot.scopeType} scope.`,
        observedCondition: pivot.observedCondition,
        rationale: pivot.rationale,
        suggestedMove: pivot.suggestedMove,
        suggestedPhrase: pivot.editedPhrase || pivot.suggestedPhrase,
        confidence: pivot.confidenceLevel as "low" | "medium" | "high",
        escalationCondition: pivot.escalationCondition,
        releaseCondition: pivot.releaseCondition,
        reviewState: pivot.reviewState,
        createdBy: pivot.createdBy,
      };
    }),
    strengths: evidenceMapItems.filter(
      (item: any) => item.classification === "evidence_suggests_ready"
    ),
    followUps: evidenceMapItems.filter(
      (item: any) => item.classification !== "evidence_suggests_ready"
    ),
    misunderstandingPatterns,
    perLearnerNotes: session.studentSessions.map((student: any) => {
      const unresolved = student.misconceptions.filter((item: any) => !item.resolved).length;
      const observedOutcomes = student.loAssessments.filter(
        (assessment: any) => statusScore(assessment.status) !== null
      ).length;
      return {
        studentSessionId: student.id,
        learnerName: student.studentName,
        observedOutcomes,
        unresolvedMisunderstandings: unresolved,
        summaryContested: student.summaryContested,
        note: `${observedOutcomes} outcome${observedOutcomes === 1 ? "" : "s"} with observed evidence; ${unresolved} unresolved misunderstanding signal${unresolved === 1 ? "" : "s"}.${student.summaryContested ? " The learner contested or corrected the AI summary." : ""}`,
      };
    }),
    learningOutcomeEvidence: evidenceMapItems,
    evidenceAppendix: evidenceAppendix as TeachingBriefEvidenceReference[],
  };
}
