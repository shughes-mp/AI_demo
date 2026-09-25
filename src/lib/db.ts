import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  tursoSchemaReady: Promise<void> | undefined;
  legacyOwnerReady: Promise<void> | undefined;
};

function getRemoteDatabaseUrl(): string | undefined {
  if (process.env.AI_DEMO_USE_LOCAL_DATABASE === "1") {
    return undefined;
  }
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  if (process.env.DATABASE_URL?.startsWith("libsql://")) {
    return process.env.DATABASE_URL;
  }

  return undefined;
}

function isHostedProductionEnvironment() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function getLocalDatabasePath() {
  const configured =
    process.env.LOCAL_DATABASE_URL ||
    (process.env.DATABASE_URL?.startsWith("file:")
      ? process.env.DATABASE_URL
      : "file:./prisma/dev.db");
  return configured.replace(/^file:/, "");
}

type LibsqlClient = {
  execute: (args: string | { sql: string; args?: unknown[] }) => Promise<unknown>;
  executeMultiple: (sql: string) => Promise<unknown>;
};

const TURSO_BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "courseContext" TEXT,
  "learningGoal" TEXT,
  "learningOutcomes" TEXT,
  "prerequisiteMap" TEXT,
  "accessCode" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "opensAt" DATETIME,
  "closesAt" DATETIME,
  "maxExchanges" INTEGER NOT NULL DEFAULT 20,
  "stance" TEXT NOT NULL DEFAULT 'directed',
  "sessionPurpose" TEXT NOT NULL DEFAULT 'pre_class',
  "planningOpeningQuestion" TEXT,
  "planningTaskInstructions" TEXT,
  "planningIntendedOutput" TEXT,
  "participationPlan" TEXT NOT NULL DEFAULT '{}',
  "anticipatedPivots" TEXT NOT NULL DEFAULT '[]',
  "planningVersion" TEXT NOT NULL DEFAULT 'planning-1.0.0',
  "learnerPreviewCheckedAt" DATETIME,
  "ownerClerkUserId" TEXT
);
CREATE TABLE IF NOT EXISTS "Reading" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reading_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Assessment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assessment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Checkpoint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "prompt" TEXT NOT NULL,
  "processLevel" TEXT NOT NULL,
  "passageAnchors" TEXT,
  "expectations" TEXT,
  "misconceptionSeeds" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Checkpoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "StudentSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "softRevisitQueue" TEXT NOT NULL DEFAULT '[]',
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" DATETIME,
  "sessionSummary" TEXT,
  "reflectionChangedThinking" TEXT,
  "reflectionSupportedClaim" TEXT,
  "reflectionRemainingUncertainty" TEXT,
  "reflectionNextStep" TEXT,
  "summaryAnnotation" TEXT,
  "summaryContested" BOOLEAN NOT NULL DEFAULT false,
  "reflectionSubmittedAt" DATETIME,
  "accessTokenHash" TEXT,
  CONSTRAINT "StudentSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentSessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "topicThread" TEXT,
  "attemptNumber" INTEGER,
  "isGenuineAttempt" BOOLEAN,
  "mode" TEXT,
  "questionType" TEXT,
  "feedbackType" TEXT,
  "expertModelType" TEXT,
  "selfExplainPrompted" BOOLEAN NOT NULL DEFAULT false,
  "cognitiveConflictStage" TEXT,
  "misconceptionResolved" BOOLEAN NOT NULL DEFAULT false,
  "isRevisitProbe" BOOLEAN NOT NULL DEFAULT false,
  "engagementFlag" TEXT,
  "engagementNote" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TutorGrounding" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "messageId" TEXT NOT NULL,
  "studentSessionId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sourceSetVersion" TEXT,
  "retrievalVersion" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "parserVersion" TEXT NOT NULL,
  "learnerCitationVisible" BOOLEAN NOT NULL DEFAULT false,
  "unsupportedReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TutorGrounding_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TutorGrounding_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TutorSourceCitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "groundingId" TEXT NOT NULL,
  "readingId" TEXT,
  "filename" TEXT NOT NULL,
  "passageId" TEXT NOT NULL,
  "quotedText" TEXT NOT NULL,
  "startOffset" INTEGER NOT NULL,
  "endOffset" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TutorSourceCitation_groundingId_fkey" FOREIGN KEY ("groundingId") REFERENCES "TutorGrounding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TutorSourceCitation_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "Reading" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ProtectedAssessmentAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "studentSessionId" TEXT NOT NULL,
  "messageId" TEXT,
  "assessmentIds" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "sourceConflict" BOOLEAN NOT NULL DEFAULT false,
  "detail" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProtectedAssessmentAudit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProtectedAssessmentAudit_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProtectedAssessmentAudit_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Misconception" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentSessionId" TEXT NOT NULL,
  "topicThread" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "studentMessage" TEXT NOT NULL,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "persistentlyUnresolved" BOOLEAN NOT NULL DEFAULT false,
  "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "canonicalClaim" TEXT,
  "passageAnchor" TEXT,
  "misconceptionType" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "confidence" TEXT NOT NULL DEFAULT 'medium',
  "detectedAtTurn" INTEGER,
  "resolvedAtTurn" INTEGER,
  "resolutionConfidence" TEXT,
  "resolutionEvidence" TEXT,
  "updatedAt" DATETIME,
  CONSTRAINT "Misconception_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ConfidenceCheck" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentSessionId" TEXT NOT NULL,
  "topicThread" TEXT NOT NULL,
  "rating" TEXT NOT NULL,
  "probeAsked" BOOLEAN NOT NULL DEFAULT false,
  "probeResult" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConfidenceCheck_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "structuredContent" TEXT NOT NULL DEFAULT '{}',
  "stats" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL DEFAULT 'teaching-brief-1.0.0',
  "promptVersion" TEXT,
  "modelProvider" TEXT,
  "modelId" TEXT,
  "reviewStateSummary" TEXT NOT NULL DEFAULT 'unreviewed',
  "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Report_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "SuggestedQuestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SuggestedQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "StudentCheckpoint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentSessionId" TEXT NOT NULL,
  "checkpointId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'unseen',
  "turnsSpent" INTEGER NOT NULL DEFAULT 0,
  "evidenceNotes" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentCheckpoint_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentCheckpoint_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "LOAssessment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentSessionId" TEXT NOT NULL,
  "learningOutcome" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "confidence" TEXT NOT NULL,
  "evidenceSummary" TEXT,
  "processMetrics" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LOAssessment_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TopicMastery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentSessionId" TEXT NOT NULL,
  "topicThread" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "criteriamet" TEXT NOT NULL DEFAULT '[]',
  "hintLadderRung" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TopicMastery_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "MisconceptionOverride" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "clusterLabel" TEXT NOT NULL,
  "overrideType" TEXT NOT NULL,
  "instructorNote" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MisconceptionOverride_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TeachingRecommendation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "whatToAddress" TEXT NOT NULL,
  "whyItMatters" TEXT NOT NULL,
  "evidence" TEXT NOT NULL,
  "moveFiveMin" TEXT NOT NULL,
  "moveFifteenMin" TEXT NOT NULL,
  "moveThirtyMin" TEXT NOT NULL,
  "sourceClusters" TEXT NOT NULL,
  "confidence" TEXT NOT NULL DEFAULT 'medium',
  "instructorAction" TEXT,
  "instructorNote" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeachingRecommendation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DiagnosticLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentSessionId" TEXT NOT NULL,
  "turnIndex" INTEGER NOT NULL,
  "rawResponse" TEXT NOT NULL,
  "misconceptionsDetected" INTEGER NOT NULL,
  "misconceptionsResolved" INTEGER NOT NULL,
  "engagementFlag" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiagnosticLog_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EvidenceSignal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "studentSessionId" TEXT,
  "misconceptionId" TEXT,
  "signalType" TEXT NOT NULL,
  "scopeType" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "claim" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'provisional',
  "confidenceLevel" TEXT NOT NULL,
  "confidenceRationale" TEXT NOT NULL,
  "limitations" TEXT NOT NULL,
  "missingEvidence" TEXT NOT NULL,
  "contradictoryEvidence" TEXT NOT NULL,
  "learningOutcomeIds" TEXT NOT NULL DEFAULT '[]',
  "evidenceQuestionIds" TEXT NOT NULL DEFAULT '[]',
  "opportunitySummary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "productPolicyVersion" TEXT NOT NULL,
  "terminologyVersion" TEXT NOT NULL,
  "evidencePolicyVersion" TEXT NOT NULL,
  "governancePolicyVersion" TEXT NOT NULL,
  "promptVersion" TEXT,
  "modelProvider" TEXT,
  "modelId" TEXT,
  "modelConfigurationVersion" TEXT,
  "parserVersion" TEXT,
  "rubricVersion" TEXT,
  "facilitationRuleVersion" TEXT,
  "sourceSetVersion" TEXT,
  "supersedesSignalId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceSignal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EvidenceSignal_studentSessionId_fkey" FOREIGN KEY ("studentSessionId") REFERENCES "StudentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EvidenceSignal_misconceptionId_fkey" FOREIGN KEY ("misconceptionId") REFERENCES "Misconception" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "EvidenceSignal_supersedesSignalId_fkey" FOREIGN KEY ("supersedesSignalId") REFERENCES "EvidenceSignal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EvidenceCitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "signalId" TEXT NOT NULL,
  "citationType" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "messageId" TEXT,
  "readingId" TEXT,
  "quotedText" TEXT NOT NULL,
  "startOffset" INTEGER,
  "endOffset" INTEGER,
  "sourceFilename" TEXT,
  "passageId" TEXT,
  "relevanceRationale" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceCitation_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EvidenceSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EvidenceCitation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "EvidenceCitation_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "Reading" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EvidenceReview" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "signalId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "previousStatus" TEXT NOT NULL,
  "newStatus" TEXT NOT NULL,
  "previousClaim" TEXT NOT NULL,
  "revisedClaim" TEXT,
  "rationale" TEXT,
  "contextualNote" TEXT,
  "actorType" TEXT NOT NULL DEFAULT 'instructor',
  "actorId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceReview_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EvidenceSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "FacilitationRecommendation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL DEFAULT '',
  "signalId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "scopeType" TEXT NOT NULL,
  "scopeIds" TEXT NOT NULL,
  "triggerSignalIds" TEXT NOT NULL DEFAULT '[]',
  "observedCondition" TEXT NOT NULL,
  "diagnosisQuestion" TEXT,
  "rationale" TEXT NOT NULL,
  "suggestedMove" TEXT NOT NULL,
  "suggestedPhrase" TEXT,
  "confidenceLevel" TEXT NOT NULL,
  "limitations" TEXT NOT NULL,
  "escalationCondition" TEXT,
  "releaseCondition" TEXT NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "reviewState" TEXT NOT NULL DEFAULT 'provisional',
  "selectedMode" TEXT,
  "editedPhrase" TEXT,
  "actionUsed" TEXT,
  "helpfulness" TEXT,
  "instructorFeedback" TEXT,
  "decisionActorId" TEXT,
  "decidedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FacilitationRecommendation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FacilitationRecommendation_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EvidenceSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "LearningOutcome" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "normalizedKey" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "legacySource" TEXT NOT NULL DEFAULT 'session.learningOutcomes',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningOutcome_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EvidenceQuestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "checkpointId" TEXT,
  "orderIndex" INTEGER NOT NULL,
  "prompt" TEXT NOT NULL,
  "processLevel" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "legacySource" TEXT NOT NULL DEFAULT 'checkpoint',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EvidenceQuestion_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EvidenceSignalLearningOutcome" (
  "signalId" TEXT NOT NULL,
  "learningOutcomeId" TEXT NOT NULL,
  "relevanceRationale" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("signalId", "learningOutcomeId"),
  CONSTRAINT "EvidenceSignalLearningOutcome_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EvidenceSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EvidenceSignalLearningOutcome_learningOutcomeId_fkey" FOREIGN KEY ("learningOutcomeId") REFERENCES "LearningOutcome" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EvidenceSignalQuestion" (
  "signalId" TEXT NOT NULL,
  "evidenceQuestionId" TEXT NOT NULL,
  "relevanceRationale" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("signalId", "evidenceQuestionId"),
  CONSTRAINT "EvidenceSignalQuestion_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EvidenceSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EvidenceSignalQuestion_evidenceQuestionId_fkey" FOREIGN KEY ("evidenceQuestionId") REFERENCES "EvidenceQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EvidenceQualification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "signalId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceQualification_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EvidenceSignal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "SessionInstructor" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "clerkUserId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'viewer',
  "grantedByUserId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionInstructor_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_accessCode_key" ON "Session"("accessCode");
CREATE INDEX IF NOT EXISTS "Checkpoint_sessionId_idx" ON "Checkpoint"("sessionId");
CREATE INDEX IF NOT EXISTS "StudentCheckpoint_studentSessionId_idx" ON "StudentCheckpoint"("studentSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentCheckpoint_studentSessionId_checkpointId_key" ON "StudentCheckpoint"("studentSessionId", "checkpointId");
CREATE INDEX IF NOT EXISTS "LOAssessment_studentSessionId_idx" ON "LOAssessment"("studentSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "LOAssessment_studentSessionId_learningOutcome_key" ON "LOAssessment"("studentSessionId", "learningOutcome");
CREATE UNIQUE INDEX IF NOT EXISTS "TopicMastery_studentSessionId_topicThread_key" ON "TopicMastery"("studentSessionId", "topicThread");
CREATE INDEX IF NOT EXISTS "MisconceptionOverride_sessionId_idx" ON "MisconceptionOverride"("sessionId");
CREATE INDEX IF NOT EXISTS "TeachingRecommendation_sessionId_idx" ON "TeachingRecommendation"("sessionId");
CREATE INDEX IF NOT EXISTS "DiagnosticLog_studentSessionId_idx" ON "DiagnosticLog"("studentSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "EvidenceSignal_misconceptionId_key" ON "EvidenceSignal"("misconceptionId");
CREATE INDEX IF NOT EXISTS "EvidenceSignal_sessionId_idx" ON "EvidenceSignal"("sessionId");
CREATE INDEX IF NOT EXISTS "EvidenceSignal_studentSessionId_idx" ON "EvidenceSignal"("studentSessionId");
CREATE INDEX IF NOT EXISTS "EvidenceSignal_status_idx" ON "EvidenceSignal"("status");
CREATE INDEX IF NOT EXISTS "EvidenceSignal_signalType_idx" ON "EvidenceSignal"("signalType");
CREATE INDEX IF NOT EXISTS "EvidenceCitation_signalId_idx" ON "EvidenceCitation"("signalId");
CREATE INDEX IF NOT EXISTS "EvidenceCitation_messageId_idx" ON "EvidenceCitation"("messageId");
CREATE INDEX IF NOT EXISTS "EvidenceCitation_readingId_idx" ON "EvidenceCitation"("readingId");
CREATE INDEX IF NOT EXISTS "EvidenceReview_signalId_idx" ON "EvidenceReview"("signalId");
CREATE UNIQUE INDEX IF NOT EXISTS "FacilitationRecommendation_signalId_key" ON "FacilitationRecommendation"("signalId");
CREATE INDEX IF NOT EXISTS "FacilitationRecommendation_sessionId_reviewState_idx" ON "FacilitationRecommendation"("sessionId", "reviewState");
CREATE INDEX IF NOT EXISTS "EvidenceSignal_supersedesSignalId_idx" ON "EvidenceSignal"("supersedesSignalId");
CREATE INDEX IF NOT EXISTS "LearningOutcome_sessionId_active_idx" ON "LearningOutcome"("sessionId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "LearningOutcome_sessionId_normalizedKey_key" ON "LearningOutcome"("sessionId", "normalizedKey");
CREATE UNIQUE INDEX IF NOT EXISTS "EvidenceQuestion_checkpointId_key" ON "EvidenceQuestion"("checkpointId");
CREATE INDEX IF NOT EXISTS "EvidenceQuestion_sessionId_active_idx" ON "EvidenceQuestion"("sessionId", "active");
CREATE INDEX IF NOT EXISTS "EvidenceSignalLearningOutcome_learningOutcomeId_idx" ON "EvidenceSignalLearningOutcome"("learningOutcomeId");
CREATE INDEX IF NOT EXISTS "EvidenceSignalQuestion_evidenceQuestionId_idx" ON "EvidenceSignalQuestion"("evidenceQuestionId");
CREATE INDEX IF NOT EXISTS "EvidenceQualification_signalId_kind_idx" ON "EvidenceQualification"("signalId", "kind");
CREATE INDEX IF NOT EXISTS "SessionInstructor_clerkUserId_idx" ON "SessionInstructor"("clerkUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "SessionInstructor_sessionId_clerkUserId_key" ON "SessionInstructor"("sessionId", "clerkUserId");
CREATE INDEX IF NOT EXISTS "Message_studentSessionId_idx" ON "Message"("studentSessionId");
CREATE INDEX IF NOT EXISTS "Misconception_studentSessionId_idx" ON "Misconception"("studentSessionId");
CREATE INDEX IF NOT EXISTS "ConfidenceCheck_studentSessionId_idx" ON "ConfidenceCheck"("studentSessionId");
CREATE INDEX IF NOT EXISTS "StudentSession_sessionId_idx" ON "StudentSession"("sessionId");
CREATE INDEX IF NOT EXISTS "Reading_sessionId_idx" ON "Reading"("sessionId");
CREATE INDEX IF NOT EXISTS "Assessment_sessionId_idx" ON "Assessment"("sessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "TutorGrounding_messageId_key" ON "TutorGrounding"("messageId");
CREATE INDEX IF NOT EXISTS "TutorGrounding_studentSessionId_createdAt_idx" ON "TutorGrounding"("studentSessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "TutorGrounding_status_idx" ON "TutorGrounding"("status");
CREATE INDEX IF NOT EXISTS "TutorSourceCitation_groundingId_idx" ON "TutorSourceCitation"("groundingId");
CREATE INDEX IF NOT EXISTS "TutorSourceCitation_readingId_idx" ON "TutorSourceCitation"("readingId");
CREATE INDEX IF NOT EXISTS "ProtectedAssessmentAudit_sessionId_createdAt_idx" ON "ProtectedAssessmentAudit"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProtectedAssessmentAudit_studentSessionId_idx" ON "ProtectedAssessmentAudit"("studentSessionId");
`;

async function getExistingColumns(
  client: LibsqlClient,
  tableName: string
): Promise<Set<string>> {
  const result = (await client.execute(`PRAGMA table_info("${tableName}")`)) as {
    rows?: Array<Record<string, unknown>>;
  };

  const columns = new Set<string>();
  for (const row of result.rows ?? []) {
    const columnName = row.name;
    if (typeof columnName === "string") {
      columns.add(columnName);
    }
  }

  return columns;
}

function isDuplicateColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate column name/i.test(message);
}

async function applyAdditiveSchemaChanges(
  client: LibsqlClient,
  statements: string[]
) {
  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (error) {
      // Several Vercel functions can cold-start against the same Turso database.
      // If another instance added this column after our schema read, the desired
      // state already exists and the remaining additive upgrades should continue.
      if (isDuplicateColumnError(error)) continue;
      throw error;
    }
  }
}

async function ensureTursoSchemaUpgrades(client: LibsqlClient) {
  const [misconceptionCols, messageCols, sessionCols, studentSessionCols, reportCols, facilitationCols] = await Promise.all([
    getExistingColumns(client, "Misconception"),
    getExistingColumns(client, "Message"),
    getExistingColumns(client, "Session"),
    getExistingColumns(client, "StudentSession"),
    getExistingColumns(client, "Report"),
    getExistingColumns(client, "FacilitationRecommendation"),
  ]);

  const alters: string[] = [];

  if (!sessionCols.has("learningOutcomes")) {
    alters.push('ALTER TABLE "Session" ADD COLUMN "learningOutcomes" TEXT');
  }
  if (!sessionCols.has("stance")) {
    alters.push(
      `ALTER TABLE "Session" ADD COLUMN "stance" TEXT NOT NULL DEFAULT 'directed'`
    );
  }
  if (!sessionCols.has("sessionPurpose")) {
    alters.push(
      `ALTER TABLE "Session" ADD COLUMN "sessionPurpose" TEXT NOT NULL DEFAULT 'pre_class'`
    );
  }
  if (!sessionCols.has("ownerClerkUserId")) {
    alters.push('ALTER TABLE "Session" ADD COLUMN "ownerClerkUserId" TEXT');
  }
  const planningColumns: Array<[string, string]> = [
    ["planningOpeningQuestion", "TEXT"],
    ["planningTaskInstructions", "TEXT"],
    ["planningIntendedOutput", "TEXT"],
    ["participationPlan", "TEXT NOT NULL DEFAULT '{}'"],
    ["anticipatedPivots", "TEXT NOT NULL DEFAULT '[]'"],
    ["planningVersion", "TEXT NOT NULL DEFAULT 'planning-1.0.0'"],
    ["learnerPreviewCheckedAt", "DATETIME"],
  ];
  for (const [columnName, definition] of planningColumns) {
    if (!sessionCols.has(columnName)) {
      alters.push(`ALTER TABLE "Session" ADD COLUMN "${columnName}" ${definition}`);
    }
  }

  const misconceptionNewCols: Array<[string, string]> = [
    ["canonicalClaim", "TEXT"],
    ["passageAnchor", "TEXT"],
    ["misconceptionType", "TEXT"],
    ["severity", "TEXT NOT NULL DEFAULT 'medium'"],
    ["confidence", "TEXT NOT NULL DEFAULT 'medium'"],
    ["updatedAt", "DATETIME"],
    ["detectedAtTurn", "INTEGER"],
    ["resolvedAtTurn", "INTEGER"],
    ["resolutionConfidence", "TEXT"],
    ["resolutionEvidence", "TEXT"],
  ];

  for (const [columnName, definition] of misconceptionNewCols) {
    if (!misconceptionCols.has(columnName)) {
      alters.push(
        `ALTER TABLE "Misconception" ADD COLUMN "${columnName}" ${definition}`
      );
    }
  }

  if (!messageCols.has("engagementFlag")) {
    alters.push('ALTER TABLE "Message" ADD COLUMN "engagementFlag" TEXT');
  }
  if (!messageCols.has("engagementNote")) {
    alters.push('ALTER TABLE "Message" ADD COLUMN "engagementNote" TEXT');
  }
  if (!studentSessionCols.has("accessTokenHash")) {
    alters.push('ALTER TABLE "StudentSession" ADD COLUMN "accessTokenHash" TEXT');
  }
  const learnerReflectionColumns: Array<[string, string]> = [
    ["reflectionChangedThinking", "TEXT"],
    ["reflectionSupportedClaim", "TEXT"],
    ["reflectionRemainingUncertainty", "TEXT"],
    ["reflectionNextStep", "TEXT"],
    ["summaryAnnotation", "TEXT"],
    ["summaryContested", "BOOLEAN NOT NULL DEFAULT false"],
    ["reflectionSubmittedAt", "DATETIME"],
  ];
  for (const [columnName, definition] of learnerReflectionColumns) {
    if (!studentSessionCols.has(columnName)) {
      alters.push(
        `ALTER TABLE "StudentSession" ADD COLUMN "${columnName}" ${definition}`
      );
    }
  }

  const reportColumns: Array<[string, string]> = [
    ["structuredContent", "TEXT NOT NULL DEFAULT '{}'"],
    ["schemaVersion", "TEXT NOT NULL DEFAULT 'teaching-brief-1.0.0'"],
    ["promptVersion", "TEXT"],
    ["modelProvider", "TEXT"],
    ["modelId", "TEXT"],
    ["reviewStateSummary", "TEXT NOT NULL DEFAULT 'unreviewed'"],
  ];
  for (const [columnName, definition] of reportColumns) {
    if (!reportCols.has(columnName)) {
      alters.push(`ALTER TABLE "Report" ADD COLUMN "${columnName}" ${definition}`);
    }
  }

  const facilitationColumns: Array<[string, string]> = [
    ["sessionId", "TEXT NOT NULL DEFAULT ''"],
    ["triggerSignalIds", "TEXT NOT NULL DEFAULT '[]'"],
    ["selectedMode", "TEXT"],
    ["editedPhrase", "TEXT"],
    ["actionUsed", "TEXT"],
    ["helpfulness", "TEXT"],
    ["instructorFeedback", "TEXT"],
    ["decisionActorId", "TEXT"],
    ["decidedAt", "DATETIME"],
  ];
  for (const [columnName, definition] of facilitationColumns) {
    if (!facilitationCols.has(columnName)) {
      alters.push(
        `ALTER TABLE "FacilitationRecommendation" ADD COLUMN "${columnName}" ${definition}`
      );
    }
  }

  if (alters.length > 0) {
    await applyAdditiveSchemaChanges(client, alters);
  }

  await client.execute(
    `UPDATE "FacilitationRecommendation"
     SET "sessionId" = COALESCE(NULLIF("sessionId", ''), (
       SELECT "sessionId" FROM "EvidenceSignal"
       WHERE "EvidenceSignal"."id" = "FacilitationRecommendation"."signalId"
     ), '')`
  );
  await client.execute(
    `CREATE INDEX IF NOT EXISTS "FacilitationRecommendation_sessionId_reviewState_idx"
     ON "FacilitationRecommendation"("sessionId", "reviewState")`
  );

  await client.execute(
    `UPDATE "Misconception" SET "updatedAt" = COALESCE("updatedAt", "detectedAt", CURRENT_TIMESTAMP)`
  );
  await client.execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS "StudentSession_accessTokenHash_key" ON "StudentSession"("accessTokenHash")`
  );
}

function createPrismaClient(): PrismaClient {
  const remoteDatabaseUrl = getRemoteDatabaseUrl();

  if (remoteDatabaseUrl) {
    // Production: Turso Cloud via libsql
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({
      url: remoteDatabaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter } as never);
  }

  if (isHostedProductionEnvironment()) {
    const message =
      "Production database is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel.";
    console.error(message);
    throw new Error(message);
  }

  // Local dev: better-sqlite3 (not loaded on Vercel)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url: getLocalDatabasePath() });
  return new PrismaClient({ adapter } as never);
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export async function ensureDatabaseReady() {
  const remoteDatabaseUrl = getRemoteDatabaseUrl();
  if (remoteDatabaseUrl && !globalForPrisma.tursoSchemaReady) {
    globalForPrisma.tursoSchemaReady = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require("@libsql/client");
      const client = createClient({
        url: remoteDatabaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      await client.executeMultiple(TURSO_BOOTSTRAP_SQL);
      await ensureTursoSchemaUpgrades(client as LibsqlClient);
    })();
  }

  if (globalForPrisma.tursoSchemaReady) {
    await globalForPrisma.tursoSchemaReady;
  }

  const legacyOwner = process.env.LEGACY_SESSION_OWNER_CLERK_USER_ID?.trim();
  if (legacyOwner && !globalForPrisma.legacyOwnerReady) {
    globalForPrisma.legacyOwnerReady = getPrismaClient().session
      .updateMany({
        where: { ownerClerkUserId: null },
        data: { ownerClerkUserId: legacyOwner },
      })
      .then(() => undefined);
  }
  if (globalForPrisma.legacyOwnerReady) {
    await globalForPrisma.legacyOwnerReady;
  }
}
