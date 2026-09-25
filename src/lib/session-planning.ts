import { parseLearningOutcomes } from "./evidence-definition-parser.ts";
import { PRODUCTIVE_STRUGGLE_STEPS } from "./learner-experience.ts";
import { getSessionPurposeOption, normalizeSessionPurpose } from "./session-purpose.ts";

export const SESSION_PLANNING_VERSION = "planning-1.0.0";

export type PlannedFacilitationMode = "observer" | "guide" | "conductor";

export interface ParticipationPlan {
  individualThinking: string;
  peerExchange: string;
  alternativeChannels: string;
  quieterVoices: string;
  concentrationReset: string;
}

export interface AnticipatedPivotPoint {
  id: string;
  likelyWobblePoint: string;
  watchFor: string;
  diagnosisQuestion: string;
  initialMode: PlannedFacilitationMode;
  guidePhrase: string;
  conductorPhrase: string;
  escalationCondition: string;
  releaseCondition: string;
  intendedOutput: string;
  createdBy: "rule" | "instructor";
}

export interface PlanningCheckpoint {
  id: string;
  prompt: string;
  processLevel: string;
  misconceptionSeeds: string | null;
}

export interface PlanningSessionInput {
  id: string;
  name: string;
  description: string | null;
  learningGoal: string | null;
  learningOutcomes: string | null;
  maxExchanges: number;
  sessionPurpose: string;
  planningOpeningQuestion: string | null;
  planningTaskInstructions: string | null;
  planningIntendedOutput: string | null;
  participationPlan: string;
  anticipatedPivots: string;
  planningVersion: string;
}

export interface SessionDesignCheck {
  code:
    | "recall_only_questions"
    | "question_load"
    | "outcome_coverage"
    | "source_support"
    | "task_clarity"
    | "protected_overlap"
    | "usable_output"
    | "shared_confusion_plan"
    | "participation_plan";
  status: "ready" | "review" | "needs_attention";
  title: string;
  detail: string;
}

const EMPTY_PARTICIPATION_PLAN: ParticipationPlan = {
  individualThinking: "",
  peerExchange: "",
  alternativeChannels: "",
  quieterVoices: "",
  concentrationReset: "",
};

function clean(value: unknown, limit = 4000) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function parseStringArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((item) => clean(item, 1000)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function parseParticipationPlan(value: string | null | undefined): ParticipationPlan {
  try {
    const parsed = JSON.parse(value || "{}") as Partial<ParticipationPlan>;
    return {
      individualThinking: clean(parsed.individualThinking),
      peerExchange: clean(parsed.peerExchange),
      alternativeChannels: clean(parsed.alternativeChannels),
      quieterVoices: clean(parsed.quieterVoices),
      concentrationReset: clean(parsed.concentrationReset),
    };
  } catch {
    return { ...EMPTY_PARTICIPATION_PLAN };
  }
}

export function normalizeAnticipatedPivots(value: unknown): AnticipatedPivotPoint[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((item, index) => {
    const candidate = (item ?? {}) as Partial<AnticipatedPivotPoint>;
    const initialMode: PlannedFacilitationMode =
      candidate.initialMode === "observer" ||
      candidate.initialMode === "conductor" ||
      candidate.initialMode === "guide"
        ? candidate.initialMode
        : "guide";
    return {
      id: clean(candidate.id, 120) || `pivot-${index + 1}`,
      likelyWobblePoint: clean(candidate.likelyWobblePoint),
      watchFor: clean(candidate.watchFor),
      diagnosisQuestion: clean(candidate.diagnosisQuestion),
      initialMode,
      guidePhrase: clean(candidate.guidePhrase),
      conductorPhrase: clean(candidate.conductorPhrase),
      escalationCondition: clean(candidate.escalationCondition),
      releaseCondition: clean(candidate.releaseCondition),
      intendedOutput: clean(candidate.intendedOutput),
      createdBy: candidate.createdBy === "instructor" ? "instructor" : "rule",
    };
  });
}

export function parseAnticipatedPivots(value: string | null | undefined) {
  try {
    return normalizeAnticipatedPivots(JSON.parse(value || "[]"));
  } catch {
    return [];
  }
}

function defaultOpeningQuestion(session: PlanningSessionInput) {
  const firstOutcome = parseLearningOutcomes(session.learningOutcomes)[0]?.label;
  const topic = session.learningGoal || firstOutcome || session.name;
  return `Before looking closely at the reading, what do you already know or believe about ${topic}?`;
}

export function buildLearnerExperiencePreview(
  session: PlanningSessionInput,
  checkpoints: PlanningCheckpoint[],
  hasReadings: boolean,
  hasAssessments: boolean
) {
  const purpose = getSessionPurposeOption(normalizeSessionPurpose(session.sessionPurpose));
  return {
    sessionName: session.name,
    orientation:
      session.description ||
      "Explain your current thinking, use the assigned reading as the primary reference, and expect follow-up questions rather than immediate answers.",
    openingQuestion: session.planningOpeningQuestion || defaultOpeningQuestion(session),
    sessionPurpose: {
      label: purpose.shortLabel,
      cognitiveLevel: purpose.cognitiveLevel,
      description: purpose.description,
    },
    taskInstructions:
      session.planningTaskInstructions ||
      "Work through one question at a time, explain your reasoning, and use evidence from the reading when making claims about it.",
    evidenceQuestions: checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      prompt: checkpoint.prompt,
      processLevel: checkpoint.processLevel,
    })),
    helpBehavior: PRODUCTIVE_STRUGGLE_STEPS,
    sourceGroundingMessage: hasReadings
      ? "The assigned reading is the primary reference. Broader explanations may be added when useful and will be identified separately."
      : "No assigned reading has been uploaded yet, so a source-grounded learner session cannot begin.",
    protectedAssessmentMessage: hasAssessments
      ? "Protected assessment material is kept out of the normal tutor prompt. AI_demo coaches the reasoning without revealing protected answers."
      : "No protected assessment material has been added.",
    intendedOutput:
      session.planningIntendedOutput ||
      "A source-supported claim, an explanation of the reasoning behind it, and a short reflection on what changed or remains uncertain.",
    summaryAndReflection:
      "The learner receives a formative AI summary, then can record what changed, identify a supported claim, note uncertainty, add a next step, or contest the summary before instructor review.",
  };
}

function looksRecallOnly(prompt: string, processLevel: string) {
  if (processLevel === "retrieve") return true;
  const normalized = prompt.toLowerCase().trim();
  const recallOpening = /^(what is|what are|who is|when did|where is|define|list|name|identify)\b/;
  const higherOrder = /\b(why|how|compare|distinguish|apply|evaluate|predict|explain|justify|evidence|infer|challenge)\b/;
  return recallOpening.test(normalized) && !higherOrder.test(normalized);
}

function tokenSet(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4)
  );
}

function hasProtectedOverlap(checkpoints: PlanningCheckpoint[], assessmentContents: string[]) {
  return checkpoints.some((checkpoint) => {
    const promptTokens = tokenSet(checkpoint.prompt);
    if (promptTokens.size < 4) return false;
    return assessmentContents.some((content) => {
      const assessmentTokens = tokenSet(content);
      const overlap = Array.from(promptTokens).filter((token) => assessmentTokens.has(token)).length;
      return overlap >= 4 && overlap / promptTokens.size >= 0.6;
    });
  });
}

export function evaluateSessionDesign(input: {
  session: PlanningSessionInput;
  checkpoints: PlanningCheckpoint[];
  readingCount: number;
  assessmentContents: string[];
  pivots: AnticipatedPivotPoint[];
  participation: ParticipationPlan;
}): SessionDesignCheck[] {
  const { session, checkpoints, readingCount, assessmentContents, pivots, participation } = input;
  const outcomes = parseLearningOutcomes(session.learningOutcomes);
  const recallOnly = checkpoints.filter((checkpoint) =>
    looksRecallOnly(checkpoint.prompt, checkpoint.processLevel)
  );
  const recommendedMaximum = Math.max(1, Math.floor(session.maxExchanges / 3));
  const participationItems = Object.values(participation).filter(Boolean).length;

  return [
    {
      code: "recall_only_questions",
      status: recallOnly.length > 0 ? "review" : "ready",
      title: "Evidence questions require reasoning",
      detail:
        recallOnly.length > 0
          ? `${recallOnly.length} question(s) appear recall-only. Rewrite them to require explanation, comparison, application, or evidence.`
          : "No evidence question is limited to simple recall.",
    },
    {
      code: "question_load",
      status: checkpoints.length > recommendedMaximum ? "review" : "ready",
      title: "Question load fits the available exchanges",
      detail:
        checkpoints.length > recommendedMaximum
          ? `${checkpoints.length} questions may be too many for ${session.maxExchanges} exchanges. Aim for about ${recommendedMaximum}.`
          : `${checkpoints.length} question(s) fit within the ${session.maxExchanges}-exchange limit.`,
    },
    {
      code: "outcome_coverage",
      status:
        outcomes.length > 0 && checkpoints.length >= outcomes.length
          ? "ready"
          : "needs_attention",
      title: "Every outcome has an evidence opportunity",
      detail:
        outcomes.length === 0
          ? "Add at least one learning outcome."
          : checkpoints.length < outcomes.length
            ? `${outcomes.length} outcomes are supported by only ${checkpoints.length} evidence question(s). Add or consolidate opportunities deliberately.`
            : "There is at least one evidence question per learning outcome.",
    },
    {
      code: "source_support",
      status: readingCount > 0 ? "ready" : "needs_attention",
      title: "Assigned source support is available",
      detail:
        readingCount > 0
          ? `${readingCount} source material(s) will anchor learner dialogue.`
          : "Upload at least one source reading before inviting learners.",
    },
    {
      code: "task_clarity",
      status:
        session.planningTaskInstructions && session.planningTaskInstructions.trim().length >= 30
          ? "ready"
          : "needs_attention",
      title: "Learners receive clear task instructions",
      detail:
        session.planningTaskInstructions && session.planningTaskInstructions.trim().length >= 30
          ? "The preview explains the cognitive work learners should do."
          : "Add a short instruction explaining what learners should produce or reason about.",
    },
    {
      code: "protected_overlap",
      status: hasProtectedOverlap(checkpoints, assessmentContents) ? "needs_attention" : "ready",
      title: "Evidence questions avoid protected-answer overlap",
      detail: hasProtectedOverlap(checkpoints, assessmentContents)
        ? "At least one evidence question substantially overlaps protected assessment wording. Revise it before launch."
        : "No substantial overlap with protected assessment wording was detected.",
    },
    {
      code: "usable_output",
      status: session.planningIntendedOutput?.trim() ? "ready" : "needs_attention",
      title: "A usable learner output is planned",
      detail: session.planningIntendedOutput?.trim()
        ? "The debrief has a stated learner output to use."
        : "Describe the claim, explanation, comparison, decision, or reflection you want available for debrief.",
    },
    {
      code: "shared_confusion_plan",
      status:
        pivots.some(
          (pivot) => pivot.conductorPhrase.trim() && pivot.escalationCondition.trim()
        )
          ? "ready"
          : "needs_attention",
      title: "A response to widespread confusion is prepared",
      detail:
        pivots.some(
          (pivot) => pivot.conductorPhrase.trim() && pivot.escalationCondition.trim()
        )
          ? "At least one anticipated pivot includes a shared reset and escalation boundary."
          : "Generate or add an anticipated pivot with a Conductor phrase and escalation condition.",
    },
    {
      code: "participation_plan",
      status: participationItems >= 3 ? "ready" : "review",
      title: "Participation options are prepared",
      detail:
        participationItems >= 3
          ? `${participationItems} participation supports are recorded.`
          : "Consider individual thinking time, peer exchange, alternative channels, quieter voices, and a concentration reset.",
    },
  ];
}

export function generateAnticipatedPivots(
  session: PlanningSessionInput,
  checkpoints: PlanningCheckpoint[]
): AnticipatedPivotPoint[] {
  const candidates = checkpoints.length > 0
    ? checkpoints.slice(0, 4)
    : [{
        id: "session-goal",
        prompt: session.learningGoal || session.name,
        processLevel: "infer",
        misconceptionSeeds: null,
      }];

  return candidates.map((checkpoint, index) => {
    const seed = parseStringArray(checkpoint.misconceptionSeeds)[0];
    const wobble = seed || `Learners may offer a plausible response to “${checkpoint.prompt}” without explaining or supporting it.`;
    const intendedOutput =
      session.planningIntendedOutput ||
      `A source-supported response to “${checkpoint.prompt}”.`;
    return {
      id: `generated-${checkpoint.id}-${index + 1}`,
      likelyWobblePoint: wobble,
      watchFor:
        "A repeated claim with little explanation, weak source support, or the same consequential confusion across learners.",
      diagnosisQuestion:
        "Which evidence supports this interpretation, and what would make you reconsider it?",
      initialMode: "guide",
      guidePhrase:
        "Which passage most strongly supports your current interpretation, and what does it require you to explain?",
      conductorPhrase:
        "Let’s pause on one distinction appearing across several responses. What evidence would confirm or complicate it?",
      escalationCondition:
        "Use a brief shared reset only when the same consequential misunderstanding appears in at least two learners and 40% of the observed class.",
      releaseCondition:
        "Return to Guide or Observer as soon as learners can state the distinction and continue independently.",
      intendedOutput,
      createdBy: "rule",
    };
  });
}

