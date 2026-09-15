import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { ensureNormalizedEvidenceDefinitions } from "@/lib/evidence-definitions";
import { createLearnerCapability } from "@/lib/learner-capability";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { SYSTEMS_SOCIETY_DEMO } from "@/lib/demo/complex-systems-demo";

export const DEMO_SESSION_NAME_PREFIX = "AI_thena colleague demo ·";

const COURSE_READING = `
#SystemAnalysis

Analyze and apply decompositions of systems into constituent parts at multiple levels of analysis.

Complex systems can be deconstructed in different ways that define both the scope of the system and the relevant attributes of its components. The key task is to conceptualize the constituent parts in several ways and choose or synthesize the mapping that best addresses the explanatory challenge.

In social systems, analysis can distinguish an individual or micro level, a group or organizational meso level, and a wider system or macro level. An explanation at only one level may be insufficient. A strong multilevel analysis identifies relevant agents, their attributes, interactions within levels, and consequential interactions between levels.

Example of the reasoning move: A hospital trying to reduce spending could first be decomposed by department. That view might reveal communication patterns but hide duplicated education-campaign work inside each department. Decomposing the same hospital by function could expose the duplication. The point is not merely to list parts; it is to justify why a particular decomposition helps answer a clearly stated question and, when useful, compare it with an alternative.
`;

const ASSIGNMENT_INSTRUCTIONS = `
Assignment 1 — Complex Social System Analysis

Overall goal: Individually conduct a complex social-system analysis using reliable resources and the ideas covered in Unit 1. The complete paper is 800–1,000 words. It must use APA style, cite all externally sourced information, include the required learning-outcome footnotes, and use no quotations.

Step 1 — Select and introduce the system
Choose a system not discussed in class. Explain what it is for an audience unfamiliar with it, including its features, interactions, and purpose. Explain how it is both complex and social rather than merely complicated.

Step 2 — Break down the system using #SystemAnalysis and #EvidenceBased
Break the chosen system into components. Conduct a multilevel analysis at the micro, meso, and macro levels. Within each level, identify relevant agents, agent attributes, and interactions among agents. Then explain how different levels interact with one another. Use reliable resources and cite them in APA style.

Focus of this demonstration
The learner has selected the New York City subway. The demo focuses only on the #SystemAnalysis reasoning required in Step 2: form an explanatory question, choose a useful decomposition, identify relevant agents and attributes at multiple levels, explain interactions within and between levels, and justify why the decomposition helps answer the question.

`;

const PROTECTED_TARGET = `
Protected learner-authored target: do not write, complete, draft, supply, or provide the assignment's New York City subway system-analysis answer, section, paragraph, outline, decomposition, or final prose. Coach the learner without disclosing or reconstructing a submission they could hand in as their own.
`;

const CHECKPOINTS = [
  {
    orderIndex: 0,
    prompt: "What explanatory question gives the learner's decomposition a clear purpose?",
    processLevel: "integrate",
    expectations: [
      "States a specific question about the New York City subway.",
      "Explains how the question determines which parts, attributes, and levels are relevant.",
    ],
    misconceptionSeeds: [
      "Treating the assignment as a request to inventory components without an explanatory purpose.",
    ],
  },
  {
    orderIndex: 1,
    prompt: "Which agents, attributes, and interactions are relevant at the micro level?",
    processLevel: "infer",
    expectations: [
      "Identifies decision-making people or actors rather than only physical objects.",
      "Connects relevant attributes and interactions to the explanatory question.",
    ],
    misconceptionSeeds: [
      "Calling infrastructure an agent without explaining any capacity to act or decide.",
    ],
  },
  {
    orderIndex: 2,
    prompt: "How do relevant micro, meso, and macro levels interact?",
    processLevel: "integrate",
    expectations: [
      "Represents relevant phenomena at all three levels.",
      "Traces at least one consequential relationship across levels instead of listing categories.",
    ],
    misconceptionSeeds: [
      "Naming three levels but not explaining interactions within or between them.",
    ],
  },
  {
    orderIndex: 3,
    prompt: "Why is this decomposition useful, and what might an alternative reveal?",
    processLevel: "evaluate",
    expectations: [
      "Justifies the decomposition in relation to the explanatory challenge.",
      "Recognizes that a different decomposition may reveal or obscure different relationships.",
    ],
    misconceptionSeeds: [
      "Assuming there is one inherently correct decomposition independent of the question.",
    ],
  },
  {
    orderIndex: 4,
    prompt: "Can the learner adapt the analysis to a changed subway question with less support?",
    processLevel: "evaluate",
    expectations: [
      "Adapts the selection of agents, attributes, levels, and interactions to a changed question.",
      "Explains the adaptation without reproducing the earlier scaffold.",
    ],
    misconceptionSeeds: [
      "Reusing the same decomposition without considering how a changed question changes relevance.",
    ],
  },
] as const;

async function createDemoSession() {
  const runId = randomBytes(8).toString("hex");
  const session = await prisma.session.create({
    data: {
      accessCode: `SYSTEMS-DEMO-${runId.toUpperCase()}`,
      name: `${DEMO_SESSION_NAME_PREFIX} ${SYSTEMS_SOCIETY_DEMO.course}`,
      description: SYSTEMS_SOCIETY_DEMO.assignment.goal,
      courseContext:
        "The learner is taking Systems & Society and has selected the New York City subway as a complex social system. This is an assignment-support conversation, not a request to produce the paper.",
      learningGoal: SYSTEMS_SOCIETY_DEMO.assignment.currentTask,
      learningOutcomes:
        "#SystemAnalysis — Analyze and apply decompositions of systems into constituent parts at multiple levels of analysis.",
      maxExchanges: 10,
      stance: "mentor",
      sessionPurpose: "after_class",
      planningOpeningQuestion:
        "In your own words, what do you think this part of the assignment is asking you to do with the New York City subway?",
      planningTaskInstructions:
        "Support the learner to develop a question-driven, multilevel system analysis. Ask for their thinking first; diagnose what is missing; then offer the smallest useful scaffold. Explain the assignment when asked. Do not write the assignment for them.",
      planningIntendedOutput:
        "Learner-authored reasoning that states an explanatory question, identifies relevant agents and attributes across micro, meso, and macro levels, explains cross-level interactions, and justifies the decomposition.",
      readings: {
        create: [
          {
            filename: "SystemAnalysis-course-definition.txt",
            content: COURSE_READING,
          },
          {
            filename: "Assignment-1-instructions.txt",
            content: ASSIGNMENT_INSTRUCTIONS,
          },
        ],
      },
      assessments: {
        create: {
          filename: "Assignment-1-protected-target.txt",
          content: PROTECTED_TARGET,
        },
      },
      checkpoints: {
        create: CHECKPOINTS.map((checkpoint) => ({
          orderIndex: checkpoint.orderIndex,
          prompt: checkpoint.prompt,
          processLevel: checkpoint.processLevel,
          expectations: JSON.stringify(checkpoint.expectations),
          misconceptionSeeds: JSON.stringify(checkpoint.misconceptionSeeds),
        })),
      },
    },
  });

  await ensureNormalizedEvidenceDefinitions(session.id);
  return session;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, {
    scope: "assignment-demo-start",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      {
        mode: "unavailable",
        reason: "MODEL_NOT_CONFIGURED",
        message:
          "Live AI_thena is not configured on this server. Add ANTHROPIC_API_KEY to use the interactive experience.",
      },
      { status: 503, headers: rateLimit.headers }
    );
  }

  try {
    await ensureDatabaseReady();
    const session = await createDemoSession();
    const capability = createLearnerCapability();
    const learnerSuffix = randomBytes(3).toString("hex").toUpperCase();
    const studentSession = await prisma.studentSession.create({
      data: {
        sessionId: session.id,
        studentName: `Demo learner ${learnerSuffix}`,
        accessTokenHash: capability.tokenHash,
      },
    });

    return NextResponse.json(
      {
        mode: "live",
        sessionId: session.id,
        studentSessionId: studentSession.id,
        capabilityToken: capability.token,
        maxExchanges: session.maxExchanges,
      },
      { status: 201, headers: rateLimit.headers }
    );
  } catch (error) {
    console.error("Failed to start assignment demo:", error);
    return NextResponse.json(
      {
        mode: "unavailable",
        reason: "START_FAILED",
        message: "AI_thena could not create the live demo session. Please try again.",
      },
      { status: 500, headers: rateLimit.headers }
    );
  }
}
