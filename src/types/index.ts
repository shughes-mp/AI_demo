// Shared TypeScript types for the AI_demo application

export type SessionPurpose =
  | "pre_class"
  | "during_class_prep"
  | "during_class_reflection"
  | "after_class";

export type FileCategory = "reading" | "assessment";

export interface CreateSessionRequest {
  name: string;
  description?: string;
  courseContext?: string;
  learningGoal?: string;
  learningOutcomes?: string;
  stance?: "directed" | "mentor";
  sessionPurpose?: SessionPurpose;
}

export interface CreateSessionResponse {
  id: string;
  name: string;
  accessCode: string;
}

export interface UploadFileRequest {
  category: FileCategory;
}

export interface FileInfo {
  id: string;
  filename: string;
  category: FileCategory;
  preview: string; // first 100 chars
  uploadedAt: string;
}

export interface SessionDetails {
  id: string;
  name: string;
  description: string | null;
  courseContext: string | null;
  learningGoal: string | null;
  learningOutcomes: string | null;
  prerequisiteMap: string | null;
  accessCode: string;
  createdAt: string;
  maxExchanges: number;
  stance: "directed" | "mentor";
  sessionPurpose: SessionPurpose;
  opensAt: string | null;
  closesAt: string | null;
  readingsCount: number;
  assessmentsCount: number;
  learnerPreviewCheckedAt: string | null;
  instructorRole?: "viewer" | "editor" | "owner";
}

export type CheckpointProcessLevel =
  | "retrieve"
  | "infer"
  | "integrate"
  | "evaluate";

export type StudentCheckpointStatus =
  | "unseen"
  | "probing"
  | "evidence_sufficient"
  | "evidence_insufficient"
  | "deferred";

export type LOAssessmentStatus =
  | "not_observed"
  | "insufficient_evidence"
  | "emerging"
  | "meets"
  | "exceeds";

export type LOAssessmentConfidence = "low" | "medium" | "high";

export interface CheckpointRecord {
  id: string;
  sessionId: string;
  orderIndex: number;
  prompt: string;
  processLevel: CheckpointProcessLevel;
  passageAnchors: string | null;
  expectations: string | null;
  misconceptionSeeds: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCheckpointRecord {
  id: string;
  studentSessionId: string;
  checkpointId: string;
  status: StudentCheckpointStatus;
  turnsSpent: number;
  evidenceNotes: string | null;
  updatedAt: string;
}

export interface CheckpointLintResult {
  isRecallOnly: boolean;
  suggestedRewrite: string;
  suggestedExpectations: string[];
  suggestedMisconceptions: string[];
}

export interface LOAssessmentRecord {
  id: string;
  studentSessionId: string;
  learningOutcome: string;
  status: LOAssessmentStatus;
  confidence: LOAssessmentConfidence;
  evidenceSummary: string | null;
  processMetrics: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MisconceptionClusterRecord {
  id: string;
  label: string;
  misconceptionType: string | null;
  passageAnchor: string | null;
  topicThread: string | null;
  count: number;
  totalStudents: number;
  prevalence: number;
  resolutionRate: number;
  medianTurnsToResolve: number | null;
  severity: "low" | "medium" | "high";
  resolutionConfidence?: "high" | "medium" | "low";
  detectionConfidence?: "high" | "medium" | "low";
  representativeExcerpt: string;
  misconceptionIds: string[];
  records: Array<{
    id: string;
    description: string;
    canonicalClaim: string | null;
    studentMessage: string;
    resolved: boolean;
    resolutionEvidence: string | null;
    evidenceSignalId: string | null;
    reviewState: EvidenceSignalStatus | "legacy_unversioned";
    sourceCitations: Array<{
      id: string;
      sourceFilename: string | null;
      passageId: string | null;
      quotedText: string;
    }>;
  }>;
  studentCount: number;
  overrideType: "acceptable_interpretation" | "needs_discussion" | null;
}

export interface EngagementSummary {
  on_task?: number;
  shallow?: number;
  disengaged?: number;
  off_topic?: number;
  hostile?: number;
}

export interface MisconceptionDashboardStats {
  totalStudents: number;
  totalMisconceptions: number;
  avgMisconceptionsPerStudent: number;
  overallResolutionRate: number;
  engagementSummary?: EngagementSummary;
}

export interface MisconceptionOverrideRecord {
  id: string;
  sessionId: string;
  clusterLabel: string;
  overrideType: "acceptable_interpretation" | "needs_discussion";
  instructorNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TeachingRecommendationConfidence = "low" | "medium" | "high";

export type TeachingRecommendationAction = "used" | "dismissed" | "edited" | null;

export interface TeachingRecommendationMove {
  description: string;
  script: string;
}

export interface TeachingRecommendationRecord {
  id: string;
  sessionId: string;
  whatToAddress: string;
  whyItMatters: string;
  evidence: string[];
  moves: {
    fiveMin: TeachingRecommendationMove;
    fifteenMin: TeachingRecommendationMove;
    thirtyMin: TeachingRecommendationMove;
  };
  sourceClusters: string[];
  confidence: TeachingRecommendationConfidence;
  instructorAction: TeachingRecommendationAction;
  instructorNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEntryData {
  sessionId: string;
  sessionName: string;
  description: string | null;
  courseContext?: string | null;
  learningGoal?: string | null;
  learningOutcomes?: string | null;
  stance?: "directed" | "mentor";
}

export interface ApiError {
  error: string;
  code: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface StudentSessionInfo {
  id: string;
  studentName: string;
  startedAt: string;
  endedAt: string | null;
  exchangeCount: number;
  misconceptionCount: number;
  lastActive: string;
}

export type EvidenceSignalStatus =
  | "provisional"
  | "approved"
  | "revised"
  | "rejected"
  | "superseded";

export type EvidenceReviewAction =
  | "approve"
  | "revise"
  | "reject"
  | "mark_acceptable"
  | "flag_for_discussion"
  | "add_context"
  | "supersede"
  | "undo";

export interface EvidenceCitationRecord {
  id: string;
  citationType: "learner_message" | "assistant_message" | "source_passage" | "process_event";
  recordId: string;
  quotedText: string;
  startOffset: number | null;
  endOffset: number | null;
  sourceFilename: string | null;
  passageId: string | null;
  relevanceRationale: string;
}

export interface EvidenceReviewRecord {
  id: string;
  action: EvidenceReviewAction;
  previousStatus: EvidenceSignalStatus;
  newStatus: EvidenceSignalStatus;
  previousClaim: string;
  revisedClaim: string | null;
  rationale: string | null;
  contextualNote: string | null;
  actorType: string;
  actorId: string | null;
  createdAt: string;
}

export interface FacilitationRecommendationRecord {
  id: string;
  sessionId: string;
  signalId: string;
  mode: "observer" | "guide" | "conductor";
  selectedMode: "observer" | "guide" | "conductor" | null;
  effectiveMode: "observer" | "guide" | "conductor";
  scopeType: "learner" | "group" | "class";
  scopeIds: string[];
  triggerSignalIds: string[];
  triggeringEvidence: Array<{
    signalId: string;
    claim: string;
    learnerName: string | null;
    status: EvidenceSignalStatus;
  }>;
  observedCondition: string;
  diagnosisQuestion: string | null;
  rationale: string;
  suggestedMove: string;
  suggestedPhrase: string | null;
  editedPhrase: string | null;
  effectivePhrase: string | null;
  confidenceLevel: "low" | "medium" | "high";
  limitations: string;
  escalationCondition: string | null;
  releaseCondition: string;
  ruleVersion: string;
  createdBy: "rule" | "model" | "instructor";
  reviewState: "provisional" | "accepted" | "modified" | "rejected" | "used";
  actionUsed: string | null;
  helpfulness: "helped" | "partly_helped" | "did_not_help" | "not_yet_known" | null;
  instructorFeedback: string | null;
  decisionActorId: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceSignalRecord {
  id: string;
  sessionId: string;
  studentSessionId: string | null;
  learnerName: string | null;
  signalType: string;
  scopeType: "learner" | "group" | "class";
  scopeId: string;
  claim: string;
  status: EvidenceSignalStatus;
  confidenceLevel: "low" | "medium" | "high";
  confidenceRationale: string;
  limitations: string;
  missingEvidence: string;
  contradictoryEvidence: string;
  opportunitySummary: string;
  misunderstandingResolved: boolean | null;
  learningOutcomes: Array<{ id: string; label: string }>;
  evidenceQuestions: Array<{ id: string; prompt: string; processLevel: string }>;
  qualifications: Array<{
    id: string;
    kind: "contradictory_evidence" | "missing_evidence" | "alternative_interpretation";
    summary: string;
    createdBy: string;
  }>;
  createdBy: string;
  modelId: string | null;
  promptVersion: string | null;
  parserVersion: string | null;
  evidencePolicyVersion: string;
  sourceSetVersion: string | null;
  supersedesSignalId: string | null;
  createdAt: string;
  updatedAt: string;
  citations: EvidenceCitationRecord[];
  reviews: EvidenceReviewRecord[];
  recommendation: FacilitationRecommendationRecord | null;
}

export interface LegacyUnversionedSignalRecord {
  id: string;
  learnerName: string;
  claim: string;
  description: string;
  confidence: string;
  passageAnchor: string | null;
  createdAt: string;
  provenanceLabel: "legacy-unversioned";
}
