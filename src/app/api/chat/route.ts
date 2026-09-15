import { after, NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { getAnthropic } from "@/lib/anthropic";
import { MODEL_PRIMARY } from "@/lib/models";
import {
  buildContextInstruction,
  buildSystemPrompt,
  parsePrerequisiteMap,
  type SoftRevisitItem,
} from "@/lib/system-prompt";
import {
  containsConfidencePrompt,
  computeNextAttemptState,
  extractConfidenceRating,
  parseTags,
} from "@/lib/attempt-tracker";
import {
  determineNextHintLadderRung,
  evaluateMastery,
} from "@/lib/mastery";
import { runDiagnostic } from "@/lib/diagnostic";
import { ensureNormalizedEvidenceDefinitions } from "@/lib/evidence-definitions";
import { matchesLearnerCapability } from "@/lib/learner-capability";
import {
  buildLearnerResponseSupportInstruction,
  countHelpRequests,
} from "@/lib/learner-experience";
import {
  appendLearnerCitations,
  buildUnsupportedSourceResponse,
  ensureKnowledgeScopeCue,
  GROUNDING_VERSIONS,
  parseKnowledgeScope,
  parseSourceIds,
  responseRequiresGrounding,
  retrieveRelevantPassages,
  shouldShowLearnerCitation,
  sourceSetVersion,
  validateSourceIds,
} from "@/lib/source-grounding";
import {
  assessProtectedRequest,
  buildProtectedCoachingResponse,
} from "@/lib/assessment-protection";
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";

export const maxDuration = 60;
const VALID_CHECKPOINT_STATUSES = [
  "probing",
  "evidence_sufficient",
  "evidence_insufficient",
  "deferred",
] as const;

function hasCycle(mapValue: { concepts: Array<{ id: string; prerequisites: string[] }> }): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (conceptId: string): boolean => {
    if (visited.has(conceptId)) return false;
    if (visiting.has(conceptId)) return true;

    visiting.add(conceptId);
    const concept = mapValue.concepts.find((item) => item.id === conceptId);
    for (const prereqId of concept?.prerequisites ?? []) {
      if (visit(prereqId)) return true;
    }
    visiting.delete(conceptId);
    visited.add(conceptId);
    return false;
  };

  return mapValue.concepts.some((item) => visit(item.id));
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();

    const payload = (await req.json()) as {
      studentSessionId?: string;
      capabilityToken?: string;
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!payload.studentSessionId || !payload.messages || !Array.isArray(payload.messages)) {
      return NextResponse.json(
        { error: "Invalid request payload", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(req, {
      scope: "learner-chat-session",
      identifier: payload.studentSessionId,
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

    const studentSessionId = payload.studentSessionId;
    const incomingMessages = payload.messages;
    const lastUserMessage = incomingMessages[incomingMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      return NextResponse.json(
        { error: "Missing user message", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const studentSession = await prisma.studentSession.findUnique({
      where: { id: studentSessionId },
      include: {
        session: {
          include: {
            readings: true,
            assessments: true,
          },
        },
      },
    });

    if (!studentSession) {
      return NextResponse.json(
        { error: "Session not found", code: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (
      !matchesLearnerCapability(
        payload.capabilityToken,
        studentSession.accessTokenHash
      )
    ) {
      return NextResponse.json(
        { error: "Learner session authorization failed", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (studentSession.session.closesAt && new Date(studentSession.session.closesAt) < new Date()) {
      return NextResponse.json(
        { error: "Session closed", code: "SESSION_CLOSED" },
        { status: 403 }
      );
    }

    await ensureNormalizedEvidenceDefinitions(studentSession.session.id);
    const [checkpoints, normalizedOutcomes, studentCheckpoints, dbMessages] = await Promise.all([
      prisma.checkpoint.findMany({
        where: { sessionId: studentSession.session.id },
        include: { evidenceQuestion: true },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      }),
      prisma.learningOutcome.findMany({
        where: { sessionId: studentSession.session.id, active: true },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      }),
      prisma.studentCheckpoint.findMany({
        where: { studentSessionId },
      }),
      prisma.message.findMany({
        where: { studentSessionId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const exchangeCount = Math.floor(dbMessages.length / 2);
    if (exchangeCount >= studentSession.session.maxExchanges) {
      return NextResponse.json(
        { error: "Exchange limit reached", code: "EXCHANGE_LIMIT" },
        { status: 403 }
      );
    }

    let currentTopicThread: string | null = null;
    let attemptCount = 0;
    for (const message of dbMessages) {
      if (message.role !== "assistant") continue;
      if (message.topicThread && message.topicThread !== currentTopicThread) {
        currentTopicThread = message.topicThread;
        attemptCount = 0;
      }
      if (message.isGenuineAttempt) {
        attemptCount += 1;
      }
    }

    const lastAssistantMessage = [...dbMessages].reverse().find((message) => message.role === "assistant");
    const previousQuestionType = lastAssistantMessage?.questionType ?? null;
    const confidencePromptWasAsked = containsConfidencePrompt(lastAssistantMessage?.content);
    const confidenceRating = confidencePromptWasAsked
      ? extractConfidenceRating(lastUserMessage.content)
      : null;

    const prerequisiteMap = parsePrerequisiteMap(studentSession.session.prerequisiteMap);
    if (prerequisiteMap && hasCycle(prerequisiteMap)) {
      console.warn("Ignoring prerequisite map with cycle for session", studentSession.session.id);
    }

    const activePrerequisiteMap =
      prerequisiteMap && !hasCycle(prerequisiteMap) ? prerequisiteMap : null;

    const [unresolvedMisconceptions, topicMastery, unresolvedConfidenceProbe] =
      await Promise.all([
        currentTopicThread
          ? prisma.misconception.findMany({
              where: {
                studentSessionId,
                topicThread: currentTopicThread,
                resolved: false,
              },
              orderBy: { detectedAt: "asc" },
            })
          : Promise.resolve([]),
        currentTopicThread
          ? prisma.topicMastery.findUnique({
              where: {
                studentSessionId_topicThread: {
                  studentSessionId,
                  topicThread: currentTopicThread,
                },
              },
            })
          : Promise.resolve(null),
        prisma.confidenceCheck.findFirst({
          where: {
            studentSessionId,
            probeAsked: true,
            probeResult: null,
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const softRevisitQueue = JSON.parse(studentSession.softRevisitQueue || "[]") as SoftRevisitItem[];
    const revisitTriggerAt = Math.floor(studentSession.session.maxExchanges * 0.6);
    const activeSoftRevisit =
      exchangeCount >= revisitTriggerAt && softRevisitQueue.length > 0 ? softRevisitQueue[0] : null;

    const sourceDocuments = studentSession.session.readings.map((reading: any) => ({
      id: reading.id,
      filename: reading.filename,
      content: reading.content,
    }));
    const sourcePassages = retrieveRelevantPassages(
      [
        currentTopicThread,
        lastUserMessage.content,
        studentSession.session.courseContext,
        studentSession.session.learningGoal,
        studentSession.session.learningOutcomes,
        ...checkpoints.map((checkpoint: any) => checkpoint.prompt),
      ]
        .filter(Boolean)
        .join("\n"),
      sourceDocuments
    );
    const protectionDecision = assessProtectedRequest(
      lastUserMessage.content,
      studentSession.session.assessments,
      sourcePassages
    );

    const systemPrompt = buildSystemPrompt(
      sourcePassages,
      studentSession.session.assessments.length > 0,
      {
        courseContext: studentSession.session.courseContext,
        learningGoal: studentSession.session.learningGoal,
        learningOutcomes: studentSession.session.learningOutcomes,
        stance: studentSession.session.stance,
        sessionPurpose: studentSession.session.sessionPurpose,
        planningOpeningQuestion: studentSession.session.planningOpeningQuestion,
        planningTaskInstructions: studentSession.session.planningTaskInstructions,
        planningIntendedOutput: studentSession.session.planningIntendedOutput,
      },
      checkpoints
    );

    const helpRequestCount = countHelpRequests([...dbMessages, lastUserMessage]);
    const effectiveHintRung = Math.max(
      topicMastery?.hintLadderRung ?? 0,
      Math.min(Math.max(helpRequestCount - 1, 0), 6)
    );
    const instruction = buildContextInstruction({
      lastTopicThread: currentTopicThread,
      currentAttemptCount: attemptCount,
      exchangeCount,
      maxExchanges: studentSession.session.maxExchanges,
      checkpoints,
      studentCheckpoints,
      previousQuestionType,
      unresolvedMisconceptions,
      confidenceRating,
      activeSoftRevisit,
      hintLadderRung: effectiveHintRung,
      prerequisiteMap: activePrerequisiteMap,
      sessionPurpose: studentSession.session.sessionPurpose,
    });
    const learnerSupportInstruction = buildLearnerResponseSupportInstruction(
      lastUserMessage.content,
      helpRequestCount
    );

    let currentConfidenceCheckId: string | null = null;
    if (confidenceRating) {
      const confidenceCheck = await prisma.confidenceCheck.create({
        data: {
          studentSessionId: payload.studentSessionId,
          topicThread: currentTopicThread || "general",
          rating: confidenceRating,
          probeAsked: confidenceRating !== "somewhat_confident",
        },
      });
      currentConfidenceCheckId = confidenceCheck.id;
    }

    const persistedUserMessage = await prisma.message.create({
      data: {
        studentSessionId,
        role: "user",
        content: lastUserMessage.content,
        topicThread: currentTopicThread,
      },
    });

    if (protectionDecision.protected) {
      const protectedResponse = buildProtectedCoachingResponse();
      const persistedAssistantMessage = await prisma.message.create({
        data: {
          studentSessionId,
          role: "assistant",
          content: protectedResponse,
          topicThread: currentTopicThread,
          mode: "socratic",
          questionType: "explain",
          feedbackType: "redirection",
          tutorGrounding: {
            create: {
              studentSessionId,
              status: "protected_coaching",
              sourceSetVersion: sourceSetVersion(sourceDocuments),
              retrievalVersion: GROUNDING_VERSIONS.retrieval,
              promptVersion: GROUNDING_VERSIONS.prompt,
              parserVersion: GROUNDING_VERSIONS.parser,
              learnerCitationVisible: false,
              unsupportedReason: null,
            },
          },
        },
      });

      await prisma.protectedAssessmentAudit.create({
        data: {
          sessionId: studentSession.session.id,
          studentSessionId,
          messageId: persistedAssistantMessage.id,
          assessmentIds: JSON.stringify(protectionDecision.assessmentIds),
          triggerType: protectionDecision.triggerType,
          action: "coaching_without_disclosure",
          sourceConflict: protectionDecision.sourceConflict,
          detail: protectionDecision.rationale,
          policyVersion: GROUNDING_VERSIONS.protection,
        },
      });

      return new Response(protectedResponse, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          ...rateLimit.headers,
        },
      });
    }

    const anthropicMessages = incomingMessages.map((message, index) => {
      if (index === incomingMessages.length - 1 && message.role === "user") {
        return {
          role: message.role,
          content: `${instruction}${learnerSupportInstruction ? `\n${learnerSupportInstruction}` : ""}\n\nUser Message: ${message.content}`,
        };
      }

      return { role: message.role, content: message.content };
    });

    const encoder = new TextEncoder();
    let capturedDiagnosticInput: Parameters<typeof runDiagnostic>[0] | null =
      null;
    const anthropicStream = await getAnthropic().messages.create({
      model: MODEL_PRIMARY,
      system: systemPrompt,
      messages: anthropicMessages,
      max_tokens: 1400,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullResponse += event.delta.text;
            }
          }

          const requestedSourceIds = parseSourceIds(fullResponse);
          const knowledgeScope = parseKnowledgeScope(fullResponse);
          const validCitations = validateSourceIds(
            requestedSourceIds,
            sourcePassages,
            fullResponse
          );
          const requiresGrounding = responseRequiresGrounding(fullResponse, sourcePassages);
          const learnerCitationVisible =
            requiresGrounding &&
            validCitations.length > 0 &&
            shouldShowLearnerCitation(fullResponse);
          const parsedResponse = parseTags(fullResponse);
          const transparentResponse = ensureKnowledgeScopeCue(
            parsedResponse.cleanedText,
            knowledgeScope
          );
          const groundedResponse =
            requiresGrounding && validCitations.length === 0
              ? buildUnsupportedSourceResponse()
              : learnerCitationVisible
                ? appendLearnerCitations(transparentResponse, validCitations)
                : transparentResponse;
          const finalCleanedText = groundedResponse.replace(/[\u2014\u2013]/g, "-");
          const groundingStatus = requiresGrounding
            ? validCitations.length > 0
              ? knowledgeScope === "mixed"
                ? "mixed_grounded"
                : "grounded"
              : "unsupported"
            : knowledgeScope === "background"
              ? "background_context"
              : "not_required";
          const { tags } = parsedResponse;
          const normalizedTopicThread =
            confidenceRating === "uncertain" && currentTopicThread
              ? currentTopicThread
              : tags.topicThread || currentTopicThread;
          const nextState = computeNextAttemptState(currentTopicThread, attemptCount, {
            ...tags,
            topicThread: normalizedTopicThread,
          });

          const currentHintRung = effectiveHintRung;
          const nextHintRung = determineNextHintLadderRung(currentHintRung, tags);
          const checkpointStatusMatches = Array.from(
            fullResponse.matchAll(
              /\[CHECKPOINT_STATUS:\s*([\s\S]*?)\|([\s\S]+?)\]/gi
            )
          );

          const persistedAssistantMessage = await prisma.message.create({
            data: {
              studentSessionId,
              role: "assistant",
              content: finalCleanedText,
              topicThread: normalizedTopicThread,
              attemptNumber: nextState.newAttemptCount,
              isGenuineAttempt: tags.isGenuineAttempt,
              mode: tags.mode,
              questionType: tags.questionType,
              feedbackType: tags.feedbackType,
              expertModelType: tags.expertModelType,
              selfExplainPrompted: tags.selfExplainPrompted,
              cognitiveConflictStage: tags.cognitiveConflictStage,
              misconceptionResolved: tags.misconceptionResolved,
              isRevisitProbe: tags.isRevisitProbe,
              tutorGrounding: {
                create: {
                  studentSessionId,
                  status: groundingStatus,
                  sourceSetVersion: sourceSetVersion(sourceDocuments),
                  retrievalVersion: GROUNDING_VERSIONS.retrieval,
                  promptVersion: GROUNDING_VERSIONS.prompt,
                  parserVersion: GROUNDING_VERSIONS.parser,
                  learnerCitationVisible,
                  unsupportedReason:
                    groundingStatus === "unsupported"
                      ? "The model made a course-content claim without a valid retrieved passage citation."
                      : null,
                  citations: {
                    create: validCitations.map((citation) => ({
                      readingId: citation.readingId,
                      filename: citation.filename,
                      passageId: citation.id,
                      quotedText: citation.content,
                      startOffset: citation.startOffset,
                      endOffset: citation.endOffset,
                    })),
                  },
                },
              },
            },
          });

          controller.enqueue(encoder.encode(finalCleanedText));

          const diagnosticInput = {
            studentSessionId,
            sessionId: studentSession.session.id,
            userMessageId: persistedUserMessage.id,
            assistantMessageId: persistedAssistantMessage.id,
            studentMessage: lastUserMessage.content,
            assistantMessage: finalCleanedText,
            topicThread: normalizedTopicThread,
            exchangeIndex: exchangeCount + 1,
            readings: studentSession.session.readings.map((reading: any) => ({
              id: reading.id,
              filename: reading.filename,
              content: reading.content,
            })),
            checkpoints: checkpoints.map((checkpoint: any) => ({
              id: checkpoint.id,
              prompt: checkpoint.prompt,
              evidenceQuestionId: checkpoint.evidenceQuestion?.id ?? null,
            })),
            learningOutcomes: normalizedOutcomes.map((outcome: any) => ({
              id: outcome.id,
              label: outcome.label,
            })),
            unresolvedMisconceptionIds: unresolvedMisconceptions.map(
              (misconception: any) => misconception.id
            ),
            conversationHistory: incomingMessages.map((message) => ({
              role: message.role as "user" | "assistant",
              content: message.content,
            })),
          };

          capturedDiagnosticInput = diagnosticInput;

          if (checkpointStatusMatches.length > 0) {
            const studentCheckpointMap = new Map(
              studentCheckpoints.map((item: any) => [item.checkpointId, item])
            );

            for (const match of checkpointStatusMatches) {
              const checkpointId = match[1]?.trim();
              const rawStatus = match[2]?.trim().toLowerCase();

              if (!checkpointId) continue;
              if (
                !VALID_CHECKPOINT_STATUSES.includes(
                  rawStatus as (typeof VALID_CHECKPOINT_STATUSES)[number]
                )
              ) {
                continue;
              }

              const checkpoint = checkpoints.find((item: any) => item.id === checkpointId);
              if (!checkpoint) continue;

              const existing = studentCheckpointMap.get(checkpointId) as { id: string; turnsSpent: number } | undefined;
              if (existing) {
                const updated = await prisma.studentCheckpoint.update({
                  where: { id: existing.id },
                  data: {
                    status: rawStatus,
                    turnsSpent: existing.turnsSpent + 1,
                  },
                });
                studentCheckpointMap.set(checkpointId, updated);
              } else {
                const created = await prisma.studentCheckpoint.create({
                  data: {
                    studentSessionId,
                    checkpointId,
                    status: rawStatus,
                    turnsSpent: 1,
                  },
                });
                studentCheckpointMap.set(checkpointId, created);
              }
            }
          }

          if (
            unresolvedConfidenceProbe &&
            !confidenceRating &&
            unresolvedConfidenceProbe.topicThread === (currentTopicThread || unresolvedConfidenceProbe.topicThread)
          ) {
            await prisma.confidenceCheck.update({
              where: { id: unresolvedConfidenceProbe.id },
              data: {
                probeResult: tags.isGenuineAttempt ? "passed" : "failed",
              },
            });
          }

          if (currentConfidenceCheckId && confidenceRating === "somewhat_confident") {
            await prisma.confidenceCheck.update({
              where: { id: currentConfidenceCheckId },
              data: { probeAsked: false, probeResult: null },
            });
          }

          if (
            unresolvedMisconceptions.length > 0 &&
            currentTopicThread &&
            normalizedTopicThread &&
            normalizedTopicThread !== currentTopicThread &&
            !tags.cognitiveConflictStage
          ) {
            await prisma.misconception.updateMany({
              where: {
                studentSessionId,
                topicThread: currentTopicThread,
                resolved: false,
              },
              data: { persistentlyUnresolved: true },
            });
          }

          const nextSoftRevisitQueue = [...softRevisitQueue];
          const queueTopic = normalizedTopicThread || currentTopicThread;
          const addQueueItem = (reason: SoftRevisitItem["reason"]) => {
            if (!queueTopic) return;
            if (
              nextSoftRevisitQueue.some(
                (item) => item.topicThread === queueTopic && item.reason === reason
              )
            ) {
              return;
            }

            nextSoftRevisitQueue.push({
              topicThread: queueTopic,
              reason,
              addedAtExchange: exchangeCount,
            });
          };

          if (tags.directAnswer) {
            addQueueItem("DIRECT_ANSWER");
          }

          if (confidenceRating === "uncertain") {
            addQueueItem("LOW_CONFIDENCE");
          }

          if (
            unresolvedMisconceptions.some((item: any) => item.persistentlyUnresolved) ||
            (unresolvedMisconceptions.length > 0 &&
              normalizedTopicThread !== currentTopicThread &&
              !tags.cognitiveConflictStage)
          ) {
            addQueueItem("UNRESOLVED_MISCONCEPTION");
          }

          if (activeSoftRevisit && tags.isRevisitProbe) {
            if (tags.isGenuineAttempt) {
              nextSoftRevisitQueue.shift();
            }
          }

          if (
            JSON.stringify(nextSoftRevisitQueue) !==
            JSON.stringify(softRevisitQueue)
          ) {
            await prisma.studentSession.update({
              where: { id: studentSessionId },
              data: { softRevisitQueue: JSON.stringify(nextSoftRevisitQueue) },
            });
          }

          await evaluateMastery(
            studentSessionId,
            normalizedTopicThread,
            nextHintRung
          );
          if (
            currentTopicThread &&
            normalizedTopicThread &&
            currentTopicThread !== normalizedTopicThread
          ) {
            await evaluateMastery(
              studentSessionId,
              currentTopicThread,
              topicMastery?.hintLadderRung ?? 0
            );
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    after(async () => {
      if (capturedDiagnosticInput) {
        try {
          await runDiagnostic(capturedDiagnosticInput);
        } catch (err) {
          console.error("Background diagnostic failed:", err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...rateLimit.headers,
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    const creditsUnavailable =
      error instanceof Error &&
      /credit balance is too low|plans\s*&\s*billing/i.test(error.message);
    return NextResponse.json(
      {
        error: creditsUnavailable
          ? "AI_thena’s model connection is temporarily unavailable. The demo owner needs to restore its Anthropic API access before live replies can continue."
          : "AI_thena could not process that message. Please try again.",
        code: creditsUnavailable ? "MODEL_CREDITS" : "CHAT_FAILED",
      },
      { status: creditsUnavailable ? 503 : 500 }
    );
  }
}
