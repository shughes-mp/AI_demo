import { NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { matchesLearnerCapability } from "@/lib/learner-capability";
import { generateInstructorReport } from "@/lib/report-generator";
import { parseTeachingBrief } from "@/lib/teaching-brief";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const DEMO_SESSION_NAME_PREFIX = "AI_thena colleague demo ·";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();
    const payload = (await request.json()) as {
      studentSessionId?: string;
      capabilityToken?: string;
      generateReport?: boolean;
    };
    if (!payload.studentSessionId) {
      return NextResponse.json(
        { error: "Missing studentSessionId", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(request, {
      scope: "assignment-demo-evidence-session",
      identifier: payload.studentSessionId,
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

    const authorization = await prisma.studentSession.findUnique({
      where: { id: payload.studentSessionId },
      include: { session: { select: { id: true, name: true } } },
    });
    if (
      !authorization ||
      !authorization.session.name.startsWith(DEMO_SESSION_NAME_PREFIX)
    ) {
      return NextResponse.json(
        { error: "Demo session not found", code: "SESSION_NOT_FOUND" },
        { status: 404, headers: rateLimit.headers }
      );
    }
    if (
      !matchesLearnerCapability(
        payload.capabilityToken,
        authorization.accessTokenHash
      )
    ) {
      return NextResponse.json(
        { error: "Learner session authorization failed", code: "FORBIDDEN" },
        { status: 403, headers: rateLimit.headers }
      );
    }

    let reportError: string | null = null;
    if (payload.generateReport) {
      try {
        await generateInstructorReport(authorization.sessionId);
      } catch (error) {
        console.error("Failed to generate demo instructor report:", error);
        reportError =
          "The conversation evidence is available, but the AI-generated teaching brief could not be produced.";
      }
    }

    const student = await prisma.studentSession.findUniqueOrThrow({
      where: { id: payload.studentSessionId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        misconceptions: { orderBy: { detectedAt: "asc" } },
        diagnosticLogs: { orderBy: { createdAt: "asc" } },
        loAssessments: { orderBy: { createdAt: "desc" } },
        studentCheckpoints: {
          include: { checkpoint: true },
          orderBy: { checkpoint: { orderIndex: "asc" } },
        },
        evidenceSignals: {
          include: {
            citations: true,
            qualifications: true,
            learningOutcomeLinks: { include: { learningOutcome: true } },
            evidenceQuestionLinks: { include: { evidenceQuestion: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        session: {
          include: {
            checkpoints: { orderBy: { orderIndex: "asc" } },
            reports: { orderBy: { generatedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    const checkpointState = new Map(
      student.studentCheckpoints.map((item) => [item.checkpointId, item])
    );
    const teachingBrief = parseTeachingBrief(
      student.session.reports[0]?.structuredContent
    );

    return NextResponse.json(
      {
        source: "live_ai_thena",
        generatedAt: new Date().toISOString(),
        learner: {
          name: student.studentName,
          startedAt: student.startedAt,
          endedAt: student.endedAt,
          summary: student.sessionSummary,
        },
        messages: student.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          topicThread: message.topicThread,
          attemptNumber: message.attemptNumber,
          isGenuineAttempt: message.isGenuineAttempt,
          mode: message.mode,
          questionType: message.questionType,
          feedbackType: message.feedbackType,
          expertModelType: message.expertModelType,
          selfExplainPrompted: message.selfExplainPrompted,
          cognitiveConflictStage: message.cognitiveConflictStage,
          isRevisitProbe: message.isRevisitProbe,
          engagementFlag: message.engagementFlag,
          engagementNote: message.engagementNote,
          createdAt: message.createdAt,
        })),
        checkpoints: student.session.checkpoints.map((checkpoint) => {
          const state = checkpointState.get(checkpoint.id);
          return {
            id: checkpoint.id,
            prompt: checkpoint.prompt,
            processLevel: checkpoint.processLevel,
            status: state?.status ?? "unseen",
            turnsSpent: state?.turnsSpent ?? 0,
            evidenceNotes: state?.evidenceNotes ?? null,
          };
        }),
        misconceptions: student.misconceptions.map((item) => ({
          id: item.id,
          topicThread: item.topicThread,
          description: item.description,
          studentMessage: item.studentMessage,
          severity: item.severity,
          confidence: item.confidence,
          resolved: item.resolved,
          persistentlyUnresolved: item.persistentlyUnresolved,
        })),
        diagnostics: student.diagnosticLogs.map((item) => ({
          id: item.id,
          turnIndex: item.turnIndex,
          engagementFlag: item.engagementFlag,
          misconceptionsDetected: item.misconceptionsDetected,
          misconceptionsResolved: item.misconceptionsResolved,
        })),
        evidenceSignals: student.evidenceSignals.map((signal) => ({
          id: signal.id,
          signalType: signal.signalType,
          claim: signal.claim,
          status: signal.status,
          confidenceLevel: signal.confidenceLevel,
          confidenceRationale: signal.confidenceRationale,
          limitations: signal.limitations,
          missingEvidence: signal.missingEvidence,
          contradictoryEvidence: signal.contradictoryEvidence,
          opportunitySummary: signal.opportunitySummary,
          learningOutcomes: signal.learningOutcomeLinks.map(
            (link) => link.learningOutcome.label
          ),
          evidenceQuestions: signal.evidenceQuestionLinks.map(
            (link) => link.evidenceQuestion.prompt
          ),
          citations: signal.citations.map((citation) => ({
            citationType: citation.citationType,
            quotedText: citation.quotedText,
            sourceFilename: citation.sourceFilename,
            relevanceRationale: citation.relevanceRationale,
          })),
          qualifications: signal.qualifications.map((qualification) => ({
            kind: qualification.kind,
            summary: qualification.summary,
          })),
        })),
        loAssessments: student.loAssessments.map((assessment) => ({
          learningOutcome: assessment.learningOutcome,
          status: assessment.status,
          confidence: assessment.confidence,
          evidenceSummary: assessment.evidenceSummary,
          processMetrics: assessment.processMetrics,
        })),
        teachingBrief,
        reportError,
        limitations: [
          "This is formative evidence from one AI-supported conversation, not an automated grade.",
          "A response after support does not establish that AI caused the improvement.",
          "Durable or independent transfer requires a later opportunity with less or no support.",
          "Instructor review is required before acting on any AI-generated interpretation.",
        ],
      },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (error) {
    console.error("Failed to load assignment demo evidence:", error);
    return NextResponse.json(
      { error: "Failed to load demo evidence", code: "EVIDENCE_FAILED" },
      { status: 500 }
    );
  }
}
