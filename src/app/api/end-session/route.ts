import { NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { MODEL_PRIMARY } from "@/lib/models";
import { matchesLearnerCapability } from "@/lib/learner-capability";
import {
  buildLearnerSummaryPrompt,
  validateLearnerSummary,
} from "@/lib/learner-experience";

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const { studentSessionId, capabilityToken } = await req.json();

    if (!studentSessionId) {
      return NextResponse.json({ error: "Missing studentSessionId", code: "INVALID_REQUEST" }, { status: 400 });
    }

    const studentSession = await prisma.studentSession.findUnique({
      where: { id: studentSessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        misconceptions: true,
      },
    });

    if (!studentSession) {
      return NextResponse.json({ error: "Session not found", code: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    if (
      !matchesLearnerCapability(capabilityToken, studentSession.accessTokenHash)
    ) {
      return NextResponse.json(
        { error: "Learner session authorization failed", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (studentSession.sessionSummary) {
      return NextResponse.json(
        {
          summary: studentSession.sessionSummary,
          reflection: {
            changedThinking: studentSession.reflectionChangedThinking ?? "",
            supportedClaim: studentSession.reflectionSupportedClaim ?? "",
            remainingUncertainty: studentSession.reflectionRemainingUncertainty ?? "",
            nextStep: studentSession.reflectionNextStep ?? "",
            summaryAnnotation: studentSession.summaryAnnotation ?? "",
            summaryContested: studentSession.summaryContested,
            submittedAt: studentSession.reflectionSubmittedAt,
          },
        },
        { status: 200 }
      );
    }

    // Format transcripts
    const transcript = studentSession.messages
      .map((message) => `${message.role === "user" ? "Student" : "Tutor"}: ${message.content}`)
      .join("\n\n");
    const unresolvedMisconceptions = studentSession.misconceptions.filter(
      (item) => !item.resolved || item.persistentlyUnresolved
    );

    const summaryMisconceptions = unresolvedMisconceptions.map((item) => ({
        topicThread: item.topicThread,
        description: item.description,
      }));
    const learnerTurnCount = studentSession.messages.filter(
      (message) => message.role === "user"
    ).length;
    let validatedSummary: string;

    if (learnerTurnCount < 3) {
      validatedSummary = validateLearnerSummary(
        "",
        studentSession.messages,
        summaryMisconceptions
      );
    } else {
      const prompt = buildLearnerSummaryPrompt({
        transcript,
        unresolvedMisconceptions: summaryMisconceptions,
      });
      const { text } = await generateText({
        model: anthropic(MODEL_PRIMARY),
        prompt,
      });
      validatedSummary = validateLearnerSummary(
        text,
        studentSession.messages,
        summaryMisconceptions
      );
    }

    // Save summary and mark endedAt
    await prisma.studentSession.update({
      where: { id: studentSessionId },
      data: {
        sessionSummary: validatedSummary,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ summary: validatedSummary }, { status: 200 });
  } catch (error) {
    console.error("End Session Error:", error);
    return NextResponse.json({ error: "Failed to end session", code: "END_FAILED" }, { status: 500 });
  }
}
