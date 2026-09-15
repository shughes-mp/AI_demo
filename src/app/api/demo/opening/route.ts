import { NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { ensureNormalizedEvidenceDefinitions } from "@/lib/evidence-definitions";
import { matchesLearnerCapability } from "@/lib/learner-capability";
import { getAnthropic } from "@/lib/anthropic";
import { MODEL_PRIMARY } from "@/lib/models";
import { parseTags } from "@/lib/attempt-tracker";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { retrieveRelevantPassages } from "@/lib/source-grounding";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const DEMO_SESSION_NAME_PREFIX = "AI_thena colleague demo ·";

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();
    const payload = (await request.json()) as {
      studentSessionId?: string;
      capabilityToken?: string;
    };
    if (!payload.studentSessionId) {
      return NextResponse.json(
        { error: "Missing studentSessionId", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(request, {
      scope: "assignment-demo-opening-session",
      identifier: payload.studentSessionId,
      limit: 4,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

    const studentSession = await prisma.studentSession.findUnique({
      where: { id: payload.studentSessionId },
      include: {
        session: {
          include: {
            readings: true,
            assessments: true,
            checkpoints: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    });
    if (
      !studentSession ||
      !studentSession.session.name.startsWith(DEMO_SESSION_NAME_PREFIX)
    ) {
      return NextResponse.json(
        { error: "Demo session not found", code: "SESSION_NOT_FOUND" },
        { status: 404, headers: rateLimit.headers }
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
        { status: 403, headers: rateLimit.headers }
      );
    }

    await ensureNormalizedEvidenceDefinitions(studentSession.session.id);
    const session = studentSession.session;
    const sourcePassages = retrieveRelevantPassages(
      [
        session.courseContext,
        session.learningGoal,
        session.learningOutcomes,
        session.planningOpeningQuestion,
        ...session.checkpoints.map((checkpoint) => checkpoint.prompt),
      ]
        .filter(Boolean)
        .join("\n"),
      session.readings.map((reading) => ({
        id: reading.id,
        filename: reading.filename,
        content: reading.content,
      }))
    );
    const systemPrompt = buildSystemPrompt(
      sourcePassages,
      session.assessments.length > 0,
      {
        courseContext: session.courseContext,
        learningGoal: session.learningGoal,
        learningOutcomes: session.learningOutcomes,
        stance: session.stance,
        sessionPurpose: session.sessionPurpose,
        planningOpeningQuestion: session.planningOpeningQuestion,
        planningTaskInstructions: session.planningTaskInstructions,
        planningIntendedOutput: session.planningIntendedOutput,
      },
      session.checkpoints
    );

    const response = await getAnthropic().messages.create({
      model: MODEL_PRIMARY,
      system: systemPrompt,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content:
            "This is a system-generated kickoff, not learner evidence. Welcome the learner briefly to the Systems & Society assignment. In plain, natural language, tell them they do not need to know where to begin or have chosen a system yet. Say that you can help them understand the task, learn the concepts, choose or check a system, or discuss work they have started—but that the important decisions and writing remain theirs. Then ask the configured routing question. Do not demand an assignment attempt until you know what help they need. Avoid institutional or promotional language. Ask only one main question.",
        },
      ],
    });
    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    const opening = parseTags(rawText).cleanedText.trim();

    return NextResponse.json(
      { opening },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (error) {
    console.error("Failed to generate assignment demo opening:", error);
    return NextResponse.json(
      {
        error: "AI_thena could not generate the opening question.",
        code: "OPENING_FAILED",
      },
      { status: 500 }
    );
  }
}
