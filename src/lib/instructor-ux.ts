export const INSTRUCTOR_LABELS = {
  setup: "Set up session",
  sources: "Source materials",
  evidenceQuestions: "Evidence questions",
  planning: "Preview learner experience",
  share: "Share with learners",
  monitor: "Learner activity",
  liveSignals: "Live signals",
  evidence: "Review learner evidence",
  grounding: "Source use check",
  groundingDetails: "Source-use details",
  brief: "Prepare teaching brief",
  teachingMoves: "Suggested teaching moves",
  export: "Export brief",
  sessionSnapshot: "Session snapshot",
  needsReview: "Needs instructor review",
  mixedGrounded: "Uses reading + broader explanation",
  unsupported: "Not supported by the reading",
  stuck: "If learners get stuck",
} as const;

export type InstructorWorkspacePhase = "prepare" | "run" | "review";

export type InstructorWorkspaceNavKey =
  | "setup"
  | "sources"
  | "evidence-questions"
  | "preview"
  | "share"
  | "learner-activity"
  | "live-signals"
  | "suggested-moves"
  | "teaching-brief"
  | "evidence-review"
  | "source-use"
  | "export";

export interface InstructorWorkspaceNavItem {
  key: InstructorWorkspaceNavKey;
  label: string;
  href: string;
  phase: InstructorWorkspacePhase;
  description: string;
}

export interface InstructorWorkspacePhaseConfig {
  key: InstructorWorkspacePhase;
  label: string;
  href: string;
  description: string;
  items: InstructorWorkspaceNavItem[];
}

export function getInstructorWorkspacePhases(sessionId: string): InstructorWorkspacePhaseConfig[] {
  return [
    {
      key: "prepare",
      label: "Setup",
      href: `/instructor/${sessionId}`,
      description: "Design the learner task before sharing it.",
      items: [
        {
          key: "setup",
          label: INSTRUCTOR_LABELS.setup,
          href: `/instructor/${sessionId}`,
          phase: "prepare",
          description: "Define purpose and outcomes.",
        },
        {
          key: "sources",
          label: INSTRUCTOR_LABELS.sources,
          href: `/instructor/${sessionId}#source-materials`,
          phase: "prepare",
          description: "Upload the reading learners should use.",
        },
        {
          key: "evidence-questions",
          label: INSTRUCTOR_LABELS.evidenceQuestions,
          href: `/instructor/${sessionId}#evidence-questions`,
          phase: "prepare",
          description: "Choose the questions AI_demo will listen for.",
        },
        {
          key: "preview",
          label: INSTRUCTOR_LABELS.planning,
          href: `/instructor/${sessionId}/planning`,
          phase: "prepare",
          description: "See what learners will encounter.",
        },
        {
          key: "share",
          label: INSTRUCTOR_LABELS.share,
          href: `/instructor/${sessionId}#learner-link`,
          phase: "prepare",
          description: "Copy the learner link when required setup is done.",
        },
      ],
    },
    {
      key: "run",
      label: "Run",
      href: `/instructor/${sessionId}/monitor?view=snapshot`,
      description: "Watch learner activity while the session is live.",
      items: [
        {
          key: "learner-activity",
          label: INSTRUCTOR_LABELS.monitor,
          href: `/instructor/${sessionId}/monitor?view=snapshot`,
          phase: "run",
          description: "See who joined and how far they got.",
        },
        {
          key: "live-signals",
          label: INSTRUCTOR_LABELS.liveSignals,
          href: `/instructor/${sessionId}/monitor?view=live#review-signals`,
          phase: "run",
          description: "Watch emerging learner issues in real time.",
        },
        {
          key: "suggested-moves",
          label: INSTRUCTOR_LABELS.teachingMoves,
          href: `/instructor/${sessionId}/monitor?view=live#suggested-moves`,
          phase: "run",
          description: "Open one proportionate next move when needed.",
        },
      ],
    },
    {
      key: "review",
      label: "Review",
      href: `/instructor/${sessionId}/analysis`,
      description: "Inspect evidence and prepare what to do next.",
      items: [
        {
          key: "teaching-brief",
          label: "Teaching brief",
          href: `/instructor/${sessionId}/analysis`,
          phase: "review",
          description: "Read the class-level summary and teaching implications.",
        },
        {
          key: "evidence-review",
          label: INSTRUCTOR_LABELS.evidence,
          href: `/instructor/${sessionId}/evidence`,
          phase: "review",
          description: "Inspect traceable learner claims and signals.",
        },
        {
          key: "source-use",
          label: INSTRUCTOR_LABELS.grounding,
          href: `/instructor/${sessionId}/grounding`,
          phase: "review",
          description: "Audit how the reading and broader context were used.",
        },
        {
          key: "export",
          label: INSTRUCTOR_LABELS.export,
          href: `/instructor/${sessionId}/report`,
          phase: "review",
          description: "Refresh and export the teaching brief.",
        },
      ],
    },
  ];
}

export const INSTRUCTOR_WORKFLOW_STEPS = [
  {
    phase: "Before learners begin",
    steps: ["Set up session", "Preview learner experience", "Share with learners"],
  },
  {
    phase: "During learner work",
    steps: ["Watch learner activity", "Review live signals"],
  },
  {
    phase: "After learner work",
    steps: ["Review learner evidence", "Prepare teaching brief"],
  },
] as const;

export const INSTRUCTOR_SESSION_STEPS = [
  {
    label: "Set up session",
    description: "Define purpose, add readings, and choose evidence questions.",
  },
  {
    label: "Preview learner experience",
    description: "Check what learners will see before sharing the link.",
  },
  {
    label: "Share with learners",
    description: "Copy the link only after the required setup is ready.",
  },
  {
    label: "Watch progress",
    description: "See who joined and whether anyone may need attention.",
  },
  {
    label: "Review evidence",
    description: "Inspect claims that need instructor judgment.",
  },
  {
    label: "Prepare teaching brief",
    description: "Decide what to do next and export a useful plan.",
  },
] as const;

export const UX_SMOKE_TEST_GATE = [
  "Can a first-time instructor create a usable session in under five minutes?",
  "Can they tell what is required vs optional?",
  "Can they preview the learner experience before sharing?",
  "Can they understand what AI_demo found without internal terminology?",
  "Can they tell what to do next after learners respond?",
  "Can they inspect evidence if they want to?",
  "Can they ignore advanced details safely?",
  "Can they export a useful brief?",
] as const;

export function formatInstructorStatus(value: string | null | undefined) {
  if (!value) return "";
  const normalized = value.replaceAll("_", " ");
  switch (value) {
    case "provisional":
      return INSTRUCTOR_LABELS.needsReview;
    case "mixed_grounded":
      return INSTRUCTOR_LABELS.mixedGrounded;
    case "unsupported":
      return INSTRUCTOR_LABELS.unsupported;
    default:
      return normalized;
  }
}
