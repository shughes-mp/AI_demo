import { NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { matchesLearnerCapability } from "@/lib/learner-capability";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const DEMO_SESSION_NAME_PREFIX = "AI_thena colleague demo ·";
const DEMO_OPENING = `Welcome to the Systems & Society assignment.

You do not need to have chosen a system - or even know where to begin. I can help you make sense of the task, understand the key concepts, choose or test a system, or discuss work you have started. The decisions and writing stay yours.

**Where would you like to begin?**`;

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
      include: { session: true },
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

    return NextResponse.json(
      { opening: DEMO_OPENING },
      { status: 200, headers: rateLimit.headers }
    );
  } catch (error) {
    console.error("Failed to generate assignment demo opening:", error);
    return NextResponse.json(
      {
        error: "The AI coach could not generate the opening question.",
        code: "OPENING_FAILED",
      },
      { status: 500 }
    );
  }
}
